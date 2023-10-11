import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './style.css'

function Customer() {
    const [data, setData] = useState([])
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        axios.get('http://localhost:8081/getCustomer')
            .then(res => {
                if (res.data.Status === "Success") {
                    console.log(res.data.Result)
                    setData(res.data.Result);
                } else {
                    alert("Error")
                }
            })
            .catch(err => console.log(err));
    }, [])

    const handleDelete = (id) => {
        axios.delete('http://localhost:8081/delete/' + id)
            .then(res => {
                if (res.data.Status === "Success") {
                    window.location.reload(true);
                } else {
                    alert("Error")
                }
            })
            .catch(err => console.log(err));
    }

    const filteredData = data.filter((customer) => {
        const searchString = searchQuery.toLowerCase();
        return (
            customer.ID.toLowerCase().includes(searchString) ||
            customer.name.toLowerCase().includes(searchString) ||
            customer.email.toLowerCase().includes(searchString) ||
            customer.serviceType.toLowerCase().includes(searchString) ||
            customer.devicePaymentPlan.toLowerCase().includes(searchString) ||
            customer.creditCardNumber.toLowerCase().includes(searchString) ||
            customer.creditCardType.toLowerCase().includes(searchString) ||
            customer.accountLastPaymentDate.toLowerCase().includes(searchString) ||
            customer.address.toLowerCase().includes(searchString) ||
            customer.state.toLowerCase().includes(searchString) ||
            customer.postalCode.toLowerCase().includes(searchString)
        );
    });

    const generateCSV = (data) => {
        const headers = Object.keys(data[0]).join(',');
        const csv = data.map((customer) => Object.values(customer).join(',')).join('\n');
        return `${headers}\n${csv}`;
    };

    // Function to trigger CSV export
    const exportCSV = () => {
        const csvContent = generateCSV(searchQuery ? filteredData : data);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'customer_data.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className='px-5 py-3'>
             <div className='d-flex justify-content-between align-items-center'>
                <div className='mb-3'>
                    <input
                        type='text'
                        placeholder='Search'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
               
                <button className='btn btn-primary' onClick={exportCSV}>
                    Export CSV
                </button>
            </div>
            <Link to="/add" className='btn btn-success mb-3'>Add Customer</Link>
            <div className="table-responsive">
                <table className="table table-striped table-bordered">
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Service Type</th>
                            <th>Device Payment Plan</th>
                            <th>Credit Card Number</th>
                            <th>Credit Card Type</th>
                            <th>Account Last Payment Date</th>
                            <th>Address</th>
                            <th>State</th>
                            <th>Postal Code</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((customer, index) => {
                            return <tr key={index}>
                                <td>{customer.ID}</td>
                                <td>{customer.name}</td>
                                <td>{customer.email}</td>
                                <td>{customer.serviceType}</td>
                                <td>{customer.devicePaymentPlan}</td>
                                <td>{customer.creditCardNumber}</td>
                                <td>{customer.creditCardType}</td>
                                <td>{customer.accountLastPaymentDate}</td>
                                <td>{customer.address}</td>
                                <td>{customer.state}</td>
                                <td>{customer.postalCode}</td>
                                <td>
                                        <Link to={`/editCustomer/` + customer.ID} className='btn btn-primary btn-sm me-2'>
                                            Update
                                        </Link>

                                        <button onClick={e => handleDelete(customer.ID)} className='btn btn-sm btn-danger'>
                                            Delete
                                        </button>
                                </td>
                            </tr>
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Customer