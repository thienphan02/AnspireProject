import { createContext, useContext, useEffect, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(() => {
    const storedUserRole = localStorage.getItem('userRole'); // Local storage for refresh
    return storedUserRole || '';
  });

  useEffect(() => { // Update local storage
    localStorage.setItem('userRole', userRole);
  }, [userRole]);

  return (
    <UserContext.Provider value={{ userRole, setUserRole }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);