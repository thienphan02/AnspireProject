import React, { useState, useEffect } from 'react';
import Login from './Login'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Dashboard from './Dashboard'
import Customer from './Customer'
import Home from './Home'
import AddCustomer from './AddCustomer'
import EditCustomer from './EditCustomer'
import Start from './Start'
import CustomerDetail from './CustomerDetail'
import CustomerLogin from './CustomerLogin'
import UserDashboard from './UserDashboard'
import AdvanceUser from './AdvanceUser'
import AdvanceDetail from './AdvanceDetail'
import AdvanceLogin from './AdvanceLogin'
import CreateUser from './CreateUser'
import CSVUploadComponent from './CSVUploadComponent';
import { UserProvider } from './UserContext';

function App() {

  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  return (
    <UserProvider>
   <BrowserRouter>
   <Routes>
        <Route path="/" element={<UserDashboard isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}>
          <Route path='' element={<Home isDarkMode={isDarkMode}/>}/>
          <Route path='/home' element={<Home isDarkMode={isDarkMode}/>} />
          <Route path='/advanceUser' element={<AdvanceUser isDarkMode={isDarkMode}/>} />
          <Route path="/customer" element={<Customer isDarkMode={isDarkMode}/>} />
          <Route path="/add" element={<AddCustomer />} />
          <Route path="/editCustomer/:id" element={<EditCustomer />} />
          <Route path="/CSVUploadComponent" element={<CSVUploadComponent />} />
        </Route>
        <Route path="login" element={<Login />} />
        <Route path="start" element={<Start />} />
        <Route path="customerLogin" element={<CustomerLogin />} />
        <Route path="advanceLogin" element={<AdvanceLogin />} />
        <Route path="createUser" element={<CreateUser />} />
        <Route path='/' element={<UserDashboard />}>
          <Route path="customerDetail/:id" element={<CustomerDetail />} />
          <Route path="advanceDetail/:id" element={<AdvanceDetail />} />
        </Route>
    </Routes>
   </BrowserRouter>
   </UserProvider>
  )
}

export default App
