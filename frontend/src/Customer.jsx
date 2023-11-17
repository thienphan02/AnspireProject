import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './style.css'
import FilterOverlay from './FilterOverlay.jsx'
import CSVUploadComponent from './CSVUploadComponent'

function Customer({ isDarkMode }) {
    const [data, setData] = useState([])
    const [showOverlay, setShowOverlay] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState(null);
    const [sortOrder, setSortOrder] = useState('asc');
    const [selectedColumn, setSelectedColumn] = useState('');
    const [searchValues, setSearchValues] = useState({
        ID: '',
        name: '',
        email: '',
        device_payment_plan: '',
        credit_card: '',
        credit_card_type: '',
        account_last_payment_date: '',
        address: '',
        state: '',
        postal_code: '',
      });  
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

    const toggleOverlay = () => {
        setShowOverlay(!showOverlay);
      };

    const handleSearchChange = (column, value) => {
        setSearchValues((prevValues) => ({
            ...prevValues,
            [column]: value,
        }));
    };

    // Handles the sorting when clicking on the column
    const handleClick = (column) => {
        if(sortBy === column) { // Clicking on same column, change from asc to desc
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }

    }

    const handleColumnSelect = (column) => {
        setSelectedColumn(column);
      };

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
        const searchString = searchQuery.toLowerCase().split(' ');
        return searchString.every((term) => {
            return (
                customer.ID.toLowerCase().includes(term) ||
                customer.name.toLowerCase().includes(term) ||
                customer.email.toLowerCase().includes(term) ||
                customer.device_payment_plan.toLowerCase().includes(term) ||
                customer.credit_card.toLowerCase().includes(term) ||
                customer.credit_card_type.toLowerCase().includes(term) ||
                customer.account_last_payment_date.toLowerCase().includes(term) ||
                customer.address.toLowerCase().includes(term) ||
                customer.state.toLowerCase().includes(term) ||
                customer.postal_code.toLowerCase().includes(term)
            );
        });
    })
    .sort((a, b) => {
      const aValue = a[sortBy] ?? '';
      const bValue = b[sortBy] ?? '';

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
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

    const handleFilterSubmit = (inputValues) => {
        console.log("Submitted: ", inputValues)
        axios.post('http://localhost:8081/filteredSearch', inputValues)
        .then(res => {
            if (res.data.Status === "Success") {
                window.location.reload(true);
            } else {
                alert("Error")
            }
        })
        .catch(err => console.log(err));
    }

    return (
        <div className="px-5">

             {/* Button to toggle the overlay */}
      <button onClick={toggleOverlay}>Filter</button>

{/* Overlay component */}
{showOverlay && <FilterOverlay onClose={toggleOverlay} onFilterSubmit={handleFilterSubmit}/>}

      {selectedColumn && (
        <div>
          <label>{selectedColumn}:</label>
          <input
            type="text"
            value={searchValues[selectedColumn]}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      )}
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
                    <Link to="/CSVUploadComponent" className='button-29 mb-3 mt-3'>Upload CSV</Link>
                    <button className='button-29 mb-3 mt-3' onClick={exportCSV}>
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="table-responsive">
            
            <table className={`table table-striped table-bordered table-hover ${isDarkMode ? 'table-dark' : 'table-light'}`}>
                  
                    <thead className="table-dark">
                        <tr>
                            <th onClick={() => handleClick('ID')}>ID</th>
                            <th onClick={() => handleClick('name')}>Name</th>
                            <th onClick={() => handleClick('email')}>Email</th>
                            <th onClick={() => handleClick('device_payment_plan')}>Device Payment Plan</th>
                            <th onClick={() => handleClick('credit_card')}>Credit Card Number</th>
                            <th onClick={() => handleClick('credit_card_type')}>Credit Card Type</th>
                            <th onClick={() => handleClick('account_last_payment_date')}>Account Last Payment Date</th>
                            <th onClick={() => handleClick('address')}>Address</th>
                            <th onClick={() => handleClick('state')}>State</th>
                            <th onClick={() => handleClick('postal_code')}>Postal Code</th>
                            <th className="Actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((customer, index) => {
                            return <tr key={index}>
                                <td>{customer.ID}</td>
                                <td>{customer.name}</td>
                                <td>{customer.email}</td>
                                <td>{customer.device_payment_plan}</td>
                                <td>{customer.credit_card}</td>
                                <td>{customer.credit_card_type}</td>
                                <td>{formatDate(customer.account_last_payment_date)}</td>
                                <td>{customer.address}</td>
                                <td>{customer.state}</td>
                                <td>{customer.postal_code}</td>
                                <td >

                                    <Link to={`/editCustomer/` + customer.ID} className='button-44 mb-1'>
                                        Update
                                    </Link>

                                    <button onClick={e => handleDelete(customer.ID)} className='button-45'>
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