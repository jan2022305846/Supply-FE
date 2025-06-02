import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fadeVariants, 
  loginContainerVariants, 
  itemVariants, 
  buttonAnimation,
  logoAnimation
} from '../components/AnimationVariants';
import UstpLogo from '../assets/school-logo.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  
  const { login, isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const expired = params.get('expired') === 'true';
  
  useEffect(() => {
    if (isAuthenticated && currentUser && !redirecting) {
      setRedirecting(true);
      const destination = currentUser.role === 'admin' ? '/admin/dashboard' : '/faculty/dashboard';
      console.log(`User already authenticated as ${currentUser.role}, redirecting to ${destination}`);
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate, redirecting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await login(username, password, rememberMe);
      
      if (result.success) {
        const user = result.user || {};
        console.log("Login successful:", user);
        
        setRedirecting(true);
        
        setTimeout(() => {
          const destination = user.role === 'admin' ? '/admin/dashboard' : '/faculty/dashboard';
          navigate(destination, { replace: true });
        }, 100);
      } else {
        setError(result.message || 'Login failed');
        setRedirecting(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('An error occurred during login. Please try again.');
      setRedirecting(false);
    } finally {
      setLoading(false);
    }
  };

  // Loading/redirecting screen
  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-100">
        <motion.div 
          className="text-center p-8 rounded-lg shadow-lg bg-white"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full mx-auto mb-6 animate-spin"></div>
          <motion.h3 
            className="text-lg font-semibold text-primary-blue font-poppins mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Preparing Your Dashboard
          </motion.h3>
          <motion.p 
            className="text-gray-medium font-roboto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            You'll be redirected momentarily...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen flex bg-gradient-to-br from-white to-gray-100"
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Left side - Brand section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-blue to-secondary-blue-dark items-center justify-center relative overflow-hidden">
        <div className="relative z-10 text-center px-8 py-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={logoAnimation}
          >
            {/* USTP Logo - Using imported image */}
            <div className="flex justify-center mb-10">
              <div className="w-48 flex items-center justify-center">
                <img src={UstpLogo} alt="USTP Panaon Logo" className="h-48 object-contain" />
              </div>
            </div>
            
            <h2 className="text-primary-yellow text-3xl font-montserrat font-semibold mb-6">
              Supply Office Inventory System
            </h2>
            <p className="text-white text-lg font-poppins font-light max-w-md mx-auto leading-relaxed">
              Efficiently manage inventory, track supplies, and streamline procurement processes for the USTP Panaon campus.
            </p>
            
            {/* Feature highlights */}
            <div className="mt-10 grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
              <div className="flex items-start">
                <div className="mt-1 bg-primary-yellow bg-opacity-20 p-1.5 rounded-full">
                  <svg className="w-4 h-4 text-primary-yellow" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-3 text-sm text-white font-poppins">Inventory Management</p>
              </div>
              <div className="flex items-start">
                <div className="mt-1 bg-primary-yellow bg-opacity-20 p-1.5 rounded-full">
                  <svg className="w-4 h-4 text-primary-yellow" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-3 text-sm text-white font-poppins">Supply Tracking</p>
              </div>
              <div className="flex items-start">
                <div className="mt-1 bg-primary-yellow bg-opacity-20 p-1.5 rounded-full">
                  <svg className="w-4 h-4 text-primary-yellow" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-3 text-sm text-white font-poppins">Procurement Processing</p>
              </div>
              <div className="flex items-start">
                <div className="mt-1 bg-primary-yellow bg-opacity-20 p-1.5 rounded-full">
                  <svg className="w-4 h-4 text-primary-yellow" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-3 text-sm text-white font-poppins">Reporting & Analytics</p>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-repeat"></div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div 
        className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-12 lg:px-16 relative">
        <motion.div 
          className="w-full max-w-md"
          variants={loginContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-semibold text-gray-dark font-poppins mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-medium mb-8 font-roboto">
              Please sign in to access your account
            </p>
          </motion.div>

          {expired && (
            <motion.div 
              className="mb-6 p-4 bg-yellow-50 border-l-4 border-primary-yellow rounded-r-md shadow-sm"
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-secondary-orange" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-secondary-orange font-roboto">
                    Your session has expired. Please sign in again.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          <AnimatePresence>
            {error && (
              <motion.div 
                className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md shadow-sm"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-600 font-roboto">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.form 
            className="space-y-6" 
            onSubmit={handleSubmit}
            variants={itemVariants}
          >
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label htmlFor="username" className="block text-sm font-medium text-gray-dark mb-1 font-roboto">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-medium rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue font-poppins text-gray-dark"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-dark mb-1 font-roboto">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-medium rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue font-poppins text-gray-dark"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center justify-between"
              variants={itemVariants}
            >
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-blue focus:ring-primary-blue border-gray-medium rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-dark font-roboto">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <a href="#" className="font-medium text-primary-blue hover:text-opacity-80 font-roboto">
                  Forgot password?
                </a>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-md text-sm font-medium text-white bg-primary-blue hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue transition-all duration-200 font-poppins"
                whileHover={buttonAnimation.hover}
                whileTap={buttonAnimation.tap}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="pt-4 border-t border-gray-200"
              variants={itemVariants}
            >
              <p className="mt-4 text-center text-sm text-gray-medium font-roboto">
                © {new Date().getFullYear()} University of Science and Technology of Southern Philippines
                <br />
                <span className="font-medium">USTP Panaon Supply Office Inventory System</span>
              </p>
            </motion.div>
          </motion.form>
        </motion.div>
      </div>
    </motion.div>
  );
}