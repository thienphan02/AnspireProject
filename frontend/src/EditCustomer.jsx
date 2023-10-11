import React, { useEffect, useState } from 'react'
import { useNavigate, useParams} from 'react-router-dom'
import axios from 'axios'

function EditCustomer() {
	const {id} = useParams()
	const navigate = useNavigate()

    const [data, setData] = useState({
        ID: '',
		name: '',
		email: '',
		serviceType: '',
        devicePaymentPlan: '',
        creditCardNumber: '',
        creditCardType: '',
        accountLastPaymentDate: '',
		address: '',
		state: '',
		postalCode: '',
	})   

	useEffect(() => {
		axios.get('http://localhost:8081/get/' + id)
		  .then(res => {
			const [customerData] = res.data.Result;
			console.log('API Response:', res.data);
			if (customerData) {
			  const {
				ID,
				name,
				email,
				serviceType,
				devicePaymentPlan,
				creditCardNumber,
				creditCardType,
				accountLastPaymentDate,
				address,
				state,
				postalCode
			  } = customerData;
			  
			  setData({
				...data,
				ID,
				name,
				email,
				serviceType,
				devicePaymentPlan,
				creditCardNumber,
				creditCardType,
				accountLastPaymentDate,
				address,
				state,
				postalCode
			  });
			} else {
			  console.log(data)
			}
		  })
		  .catch((err) => {
			console.error(err);
		  });
	  }, []);
	

    const handleSubmit = (event) => {
		event.preventDefault();
		axios.put('http://localhost:8081/update/' + id, data)
		.then(res => {
            if(res.data.Status === "Success"){
                navigate('/customer')
            }
		})
		.catch(err => console.log(err));
	}
    return (
        <div className='d-flex flex-column align-items-center pt-4'>
			<h2>Update Customer</h2>
			<form className ="row g-3 w-50" onSubmit={handleSubmit}>
            <div className ="col-12">
					<label htmlFor="inputID" className ="form-label">ID</label>
					<input type="text" className ="form-control" id="inputID" placeholder='Enter ID' autoComplete='off'
					onChange={e => setData({...data, ID: e.target.value})} value={data.ID}/>
				</div>
			<div className ="col-12">
					<label htmlFor="inputName" className ="form-label">Name</label>
					<input type="text" className ="form-control" id="inputName" placeholder='Enter Name' autoComplete='off'
					onChange={e => setData({...data, name: e.target.value})} value={data.name}/>
				</div>
				<div className ="col-12">
					<label htmlFor="inputEmail" className ="form-label">Email</label>
					<input type="email" className ="form-control" id="inputEmail" placeholder='Enter Email' autoComplete='off'
					onChange={e => setData({...data, email: e.target.value})} value={data.email}/>
				</div>
				<div className ="col-12">
					<label htmlFor="inputServiceType" className ="form-label">Service Type</label>
					<input type="Service Type" className ="form-control" id="inputServiceType" placeholder='Enter Service Type' autoComplete='off'
					 onChange={e => setData({...data, serviceType: e.target.value})} value={data.serviceType}/>
				</div>
				<div className ="col-12">
					<label htmlFor="inputDevicePaymentPlan" className ="form-label">Device Payment Plan</label>
					<input type="text" className ="form-control" id="inputDevicePaymentPlan" placeholder="Enter Device Payment Plan" autoComplete='off'
					onChange={e => setData({...data, devicePaymentPlan: e.target.value})} value={data.devicePaymentPlan}/>
				</div>
                <div className ="col-12">
					<label htmlFor="inputCreditCardNumber" className ="form-label">Credit Card Number</label>
					<input type="text" className ="form-control" id="inputCreditCardNumber" placeholder="Enter Credit Card Number" autoComplete='off'
					onChange={e => setData({...data, creditCardNumber: e.target.value})} value={data.creditCardNumber}/>
				</div>
                <div className ="col-12">
					<label htmlFor="inputCreditCardType" className ="form-label">Credit Card Type</label>
					<input type="text" className ="form-control" id="inputCreditCardType" placeholder="Credit Card Type" autoComplete='off'
					onChange={e => setData({...data, creditCardType: e.target.value})} value={data.creditCardType}/>
				</div>
                <div className ="col-12">
					<label htmlFor="inputAccountLastPaymentDate" className ="form-label">Account Last Payment Date</label>
					<input type="text" className ="form-control" id="inputAccountLastPaymentDate" placeholder="mm/dd/yyyy" autoComplete='off'
					onChange={e => setData({...data, accountLastPaymentDate: e.target.value})} value={data.accountLastPaymentDate}/>
				</div>
				<div className ="col-12">
					<label htmlFor="inputAddress" className ="form-label">Address</label>
					<input type="text" className ="form-control" id="inputAddress" placeholder="1234 Main Street" autoComplete='off'
					onChange={e => setData({...data, address: e.target.value})} value={data.address}/>
				</div>
                <div className ="col-12">
					<label htmlFor="inputState" className ="form-label">State</label>
					<input type="text" className ="form-control" id="inputState" placeholder="Enter State" autoComplete='off'
					onChange={e => setData({...data, state: e.target.value})} value={data.state}/>
				</div>
                <div className ="col-12">
					<label htmlFor="inputPostalCode" className ="form-label">Postal Code</label>
					<input type="text" className ="form-control" id="inputPostalCode" placeholder="Enter Postal Code" autoComplete='off'
					onChange={e => setData({...data, postalCode: e.target.value})} value={data.postalCode}/>
				</div>
				<div className ="col-12">
					<button type="submit" className ="btn btn-primary">Update</button>
				</div>
			</form>
		</div>
    )
}

export default EditCustomer
