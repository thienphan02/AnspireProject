import React, { useState } from 'react'

const FilterOverlay = ({ onClose, onFilterSubmit }) => {
    const [inputValues, setInputValues] = useState({
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

      const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputValues({
          ...inputValues,
          [name]: value,
        });
        console.log(inputValues);
      };

    const handleFilterSubmit = () => {
        console.log('Filter data:', inputValues);
        onFilterSubmit(inputValues); // Pass the filtered data to the callback
        onClose(); // Close the overlay after submitting
      };
  return (

    <div className="filter-overlay">
      {/* Overlay content */}
      <div className="filter-content">
        <h2>Filter</h2>
        <label>ID: <input type="text" name="ID" value={inputValues.ID} onChange={handleInputChange} /></label>
        <label>Name: <input type="text" name="name" value={inputValues.name} onChange={handleInputChange} /></label>
        <label>Email: <input type="text" name="email" value={inputValues.email} onChange={handleInputChange} /></label>
        <label>Device Payment Plan: <input type="text" value={inputValues.device_payment_plan} name="device_payment_plan" onChange={handleInputChange} /></label>
        <label>Credit Card: <input type="text" value={inputValues.credit_card} name="credit_card" onChange={handleInputChange} /></label>
        <label>Credit Card Type: <input type="text" value={inputValues.credit_card_type} name="credit_card_type" onChange={handleInputChange} /></label>
        <label>Account Last Payment Date: <input type="text" value={inputValues.account_last_payment_date} name="account_last_payment_date" onChange={handleInputChange} /></label>
        <label>Address: <input type="text" name="address" value={inputValues.address} onChange={handleInputChange} /></label>
        <label>State: <input type="text" name="state" value={inputValues.state} onChange={handleInputChange} /></label>
        <label>Postal Code: <input type="text" name="postal_code" value={inputValues.postal_code} onChange={handleInputChange} /></label>
        <button className="search-box" onClick={handleFilterSubmit}>Search</button>
      </div>
    </div>


  );
};

export default FilterOverlay;