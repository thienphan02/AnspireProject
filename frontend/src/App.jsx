import * as React from 'react'
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

function App() {
  return (
   <BrowserRouter>
   <Routes>
        <Route path="/" element={<Dashboard />}>
          <Route path='' element={<Home />}/>
          <Route path='/home' element={<Home />} />
          <Route path="/customer" element={<Customer />} />
          <Route path="/add" element={<AddCustomer />} />
          <Route path="/editCustomer/:id" element={<EditCustomer />} />
        </Route>
        <Route path="login" element={<Login />} />
        <Route path="start" element={<Start />} />
        <Route path="customerLogin" element={<CustomerLogin />} />
        <Route path='/' element={<UserDashboard />}>
          <Route path="customerDetail/:id" element={<CustomerDetail />} />
        </Route>
    </Routes>
   </BrowserRouter>
  )
}

export default App
