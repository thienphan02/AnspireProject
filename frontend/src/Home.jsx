import axios from 'axios'
import React, { useEffect, useState } from 'react'
import './style.css'



function Home({isDarkMode}) {
    const [adminCount, setAdminCount] = useState()
    const [customerCount, setCustomerCount] = useState()
    const [editHistory, setEditHistory] = useState([])



    useEffect(() => {
        axios.get('http://localhost:8081/adminCount')
            .then(res => {
                setAdminCount(res.data.recordset[0].admin)
            }).catch(err => console.log(err));

        axios.get('http://localhost:8081/customerCount')
            .then(res => {
                setCustomerCount(res.data.recordset[0].users)
            }).catch(err => console.log(err));


        axios.get('http://localhost:8081/editHistory')
            .then(res => {
                console.log(res.data); // Log the response to check its structure
                setEditHistory(res.data.recordset.EditHistory);
            })
            .catch(err => console.log(err));
    }, [])



    return (
        <div >
            <div className='p-3 d-flex justify-content-around mt-3'>
                <div className='px-3 pt-2 pb-3 border shadow-sm w-25'>
                    <div className='text-center pb-1'>
                        <h4>Admin</h4>
                    </div>
                    <hr />
                    <div className=''>
                        <h5>Total: {adminCount}</h5>
                    </div>
                </div>
                <div className='px-3 pt-2 pb-3 border shadow-sm w-25'>
                    <div className='text-center pb-1'>
                        <h4>Customers</h4>
                    </div>
                    <hr />
                    <div className=''>
                        <h5>Total: {customerCount}</h5>
                    </div>
                </div>
            </div>


            <div className={`mt-4 px-5 pt-3 edit-history-container`}>
                <h3>Edit History</h3>
                <table className={`table table-striped table-bordered table-hover ${isDarkMode ? 'table-dark' : 'table-light'}`}>
                    <thead>
                        <tr>
                            <th>Edited Field</th>
                            <th>Old Value</th>
                            <th>New Value</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {editHistory.map(entry => (
                            <tr key={entry.id}>
                                <td>{entry.edited_table}</td>
                                <td>{entry.edited_field}</td>
                                <td>{entry.new_value}</td>
                                <td>{new Date(entry.timestamp).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

            </div>
        </div>
    )
}

export default Home