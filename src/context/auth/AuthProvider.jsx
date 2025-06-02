import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthContext }from '../';
import { authService } from '../../services/api';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  
  // Define logout with useCallback to avoid dependency cycles
  const logout = useCallback(async () => {
    await authService.logout();
    setCurrentUser(null);
    // Clear timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []); // No dependencies needed since we're using refs

  // Setup periodic token refresh for session stored tokens
  const setupTokenRefresh = useCallback((timeLeft) => {
    // Clear any existing refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    
    // For session storage tokens, refresh when less than 5 minutes remain
    // But only if we're using session storage (not localStorage)
    if (sessionStorage.getItem('token') && !localStorage.getItem('token')) {
      // Calculate when to refresh - either halfway through remaining time or at 5 minutes, whichever comes first
      const refreshTime = Math.min(timeLeft / 2, 5 * 60 * 1000);
      
      if (refreshTime > 10000) { // Don't set for less than 10 seconds
        console.log(`Setting up token refresh in ${Math.round(refreshTime/60000)} minutes`);
        
        refreshTimerRef.current = setTimeout(async () => {
          console.log("Attempting to refresh token");
          const success = await authService.refreshToken();
          if (success) {
            // Re-setup refresh timer with new expiry
            const newTimeLeft = authService.getTokenExpiryTime() - new Date().getTime();
            setupTokenRefresh(newTimeLeft);
          }
        }, refreshTime);
      }
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    let isMounted = true;
    
    const checkAuthStatus = async () => {
      try {
        // Check if token is expired
        if (authService.isTokenExpired()) {
          // Clear expired session
          await authService.logout();
          if (isMounted) {
            setCurrentUser(null);
            setLoading(false);
          }
          return;
        }

        // Get current user if token valid
        const user = authService.getCurrentUser();
        if (user && isMounted) {
          setCurrentUser(user);
          
          // Set up auto-logout timer
          const expiryTime = authService.getTokenExpiryTime();
          if (expiryTime) {
            const timeLeft = expiryTime - new Date().getTime();
            
            if (timeLeft > 0) {
              // Set up token refresh for session tokens
              setupTokenRefresh(timeLeft);
              
              // Logout timing - use either 1 minute before expiry or 90% of remaining time,
              // whichever gives more time before logout but still before expiration
              const logoutBuffer = Math.min(60000, timeLeft * 0.1);
              const logoutDelay = timeLeft - logoutBuffer;
              
              console.log(`Auto-logout scheduled: ${Math.round(logoutDelay/60000)} minutes before token expires`);
              
              const timer = setTimeout(() => {
                console.log("Auto-logout: Token expiring");
                logout();
                window.location.href = '/login?expired=true';
              }, logoutDelay);
              
              if (isMounted) {
                // Store timer in ref instead of state
                timerRef.current = timer;
              } else {
                clearTimeout(timer); // Clean up if component unmounted
              }
            } else {
              // Token already expired
              await authService.logout();
              if (isMounted) {
                setCurrentUser(null);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuthStatus();
    
    return () => {
      // Mark component as unmounted
      isMounted = false;
      
      // Clear timers on unmount
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [logout, setupTokenRefresh]);

  // Login function
  const login = async (username, password, rememberMe = false) => {
    try {
      console.log("Login attempt", { username, rememberMe });
      
      const result = await authService.login(username, password, rememberMe);
      if (result.success) {
        console.log("Login successful, setting current user", result.user);
        setCurrentUser(result.user);
        
        // Set up auto-logout timer for the new login
        const expiryTime = authService.getTokenExpiryTime();
        console.log("Token expiry time:", expiryTime ? new Date(expiryTime).toLocaleString() : "Not set");
        
        if (expiryTime) {
          const timeLeft = expiryTime - new Date().getTime();
          console.log("Time until expiry:", Math.floor(timeLeft / 1000 / 60), "minutes");
          
          if (timeLeft > 0) {
            // Set up token refresh for session tokens
            setupTokenRefresh(timeLeft);
            
            // Clear any existing timer
            if (timerRef.current) {
              clearTimeout(timerRef.current);
            }
            
            // Only set timeout if expiry is in the future
            // Logout timing calculation
            const logoutBuffer = Math.min(60000, timeLeft * 0.1);
            const logoutDelay = timeLeft - logoutBuffer;
            
            const timer = setTimeout(() => {
              console.log("Token expired, logging out");
              logout();
              window.location.href = '/login?expired=true';
            }, logoutDelay);
            
            // Store in ref
            timerRef.current = timer;
          }
        }
        
        return result;
      }
      return result;
    } catch (error) {
      console.error("Login error in AuthProvider:", error);
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'admin',
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;