import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './style.css'

function Customer({ isDarkMode }) {
    const [data, setData] = useState([])
    const [searchQuery, setSearchQuery] = useState('')

    console.log('test')
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
            customer.id.toLowerCase().includes(searchString) ||
            customer.Name.toLowerCase().includes(searchString) ||
            customer.Email.toLowerCase().includes(searchString) ||
            customer.DevicePaymentPlan.toLowerCase().includes(searchString) ||
            customer.CreditCardNumber.toLowerCase().includes(searchString) ||
            customer.CreditCardType.toLowerCase().includes(searchString) ||
            customer.AccountLastPayment.toLowerCase().includes(searchString) ||
            customer.Address.toLowerCase().includes(searchString) ||
            customer.State.toLowerCase().includes(searchString) ||
            customer.PostalCode.toLowerCase().includes(searchString)
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

    const formatDate = (isoDate) => {
        const date = new Date(isoDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };


    return (
        <div className="px-5">
            <div className='search__container'>
                <div className='search__title'>
                    <input
                        className='search__input'
                        type='text'
                        placeholder='Search'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="d-flex justify-content-between">
                    <Link to="/add" className='button-28 mb-3 mt-3'>Add Customer</Link>
                    <button className='button-29 mb-3 mt-3' onClick={exportCSV}>
                        Export CSV
                    </button>
                </div>
            </div>
            <div className="table-responsive">
            
            <table className={`table table-striped table-bordered table-hover ${isDarkMode ? 'table-dark' : 'table-light'}`}>
                  
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Device Payment Plan</th>
                            <th>Credit Card Number</th>
                            <th>Credit Card Type</th>
                            <th>Account Last Payment Date</th>
                            <th>Address</th>
                            <th>State</th>
                            <th>Postal Code</th>
                            <th className="Actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((customer, index) => {
                            return <tr key={index}>
                                <td>{customer.id}</td>
                                <td>{customer.Name}</td>
                                <td>{customer.Email}</td>
                                <td>{customer.DevicePaymentPlan}</td>
                                <td>{customer.CreditCardNumber}</td>
                                <td>{customer.CreditCardType}</td>
                                <td>{formatDate(customer.AccountLastPayment)}</td>
                                <td>{customer.Address}</td>
                                <td>{customer.State}</td>
                                <td>{customer.PostalCode}</td>
                                <td >

                                    <Link to={`/editCustomer/` + customer.id} className='button-44 mb-1'>
                                        Update
                                    </Link>

                                    <button onClick={e => handleDelete(customer.id)} className='button-45'>
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