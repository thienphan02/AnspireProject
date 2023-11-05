import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function AddCustomer() {
	const [data, setData] = useState({
		Name: '',
		Email: '',
        DevicePaymentPlan: '',
        CreditCardNumber: '',
        CreditCardType: '',
        AccountLastPayment: '',
		Address: '',
		State: '',
		PostalCode: ''
	})
	const navigate = useNavigate()

    const handleSubmit = (event) => {
		event.preventDefault();
		const formdata = {
			Name: data.Name,
			Email: data.Email,
			DevicePaymentPlan: data.DevicePaymentPlan,
			CreditCardNumber: data.CreditCardNumber,
			CreditCardType: data.CreditCardType,
			AccountLastPayment: data.AccountLastPayment,
			Address: data.Address,
			State: data.State,
			PostalCode: data.PostalCode
		};
		axios.post('http://localhost:8081/add', formdata)
		.then(res => {
			navigate('/customer')
		})
		.catch(err => console.log(err));
	}

    return (
        <div className='d-flex flex-column align-items-center pt-4'>
			<h2>Add Customer</h2>
			<form className ="row g-3 w-50" onSubmit={handleSubmit}>
			<div className ="col-12">
					<label htmlFor="inputName" className ="form-label">Name</label>
					<input type="text" className ="form-control" id="inputName" placeholder='Enter Name' autoComplete='off'
					onChange={e => setData({...data, Name: e.target.value})}/>
				</div>
				<div className ="col-12">
					<label htmlFor="inputEmail" className ="form-label">Email</label>
					<input type="email" className ="form-control" id="inputEmail" placeholder='Enter Email' autoComplete='off'
					onChange={e => setData({...data, Email: e.target.value})}/>
				</div>
				<div className ="col-12">
					<label htmlFor="inputDevicePaymentPlan" className ="form-label">Device Payment Plan</label>
					<input type="text" className ="form-control" id="inputDevicePaymentPlan" placeholder="Enter Device Payment Plan" autoComplete='off'
					onChange={e => setData({...data, DevicePaymentPlan: e.target.value})}/>
				</div>
                <div className ="col-12">
					<label htmlFor="inputCreditCardNumber" className ="form-label">Credit Card Number</label>
					<input type="text" className ="form-control" id="inputCreditCardNumber" placeholder="Enter Credit Card Number" autoComplete='off'
					onChange={e => setData({...data, CreditCardNumber: e.target.value})}/>
				</div>
                <div className ="col-12">
					<label htmlFor="inputCreditCardType" className ="form-label">Credit Card Type</label>
					<input type="text" className ="form-control" id="inputCreditCardType" placeholder="Credit Card Type" autoComplete='off'
					onChange={e => setData({...data, CreditCardType: e.target.value})}/>
				</div>
                <div className ="col-12">
					<label htmlFor="inputAccountLastPaymentDate" className ="form-label">Account Last Payment Date</label>
					<input type="text" className ="form-control" id="inputAccountLastPaymentDate" placeholder="mm/dd/yyyy" autoComplete='off'
					onChange={e => setData({...data, AccountLastPayment: e.target.value})}/>
				</div>
				<div className ="col-12">
					<label htmlFor="inputAddress" className ="form-label">Address</label>
					<input type="text" className ="form-control" id="inputAddress" placeholder="1234 Main Street" autoComplete='off'
					onChange={e => setData({...data, Address: e.target.value})}/>
				</div>
                <div className ="col-12">
					<label htmlFor="inputState" className ="form-label">State</label>
					<input type="text" className ="form-control" id="inputState" placeholder="Enter State" autoComplete='off'
					onChange={e => setData({...data, State: e.target.value})}/>
				</div>
                <div className ="col-12">
					<label htmlFor="inputPostalCode" className ="form-label">Postal Code</label>
					<input type="text" className ="form-control" id="inputPostalCode" placeholder="Enter Postal Code" autoComplete='off'
					onChange={e => setData({...data, PostalCode: e.target.value})}/>
				</div>
				<div className ="col-12">
					<button type="submit" className ="btn btn-primary">Add</button>
				</div>
			</form>
		</div>
    )
}

export default AddCustomer