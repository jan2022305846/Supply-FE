import { createContext, useContext } from 'react';

// Create the context
const AuthContext = createContext(null);

// Export the context hook
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;