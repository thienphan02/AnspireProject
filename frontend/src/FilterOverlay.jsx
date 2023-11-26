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
        ServiceTypes: '',
      });

      const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
          setInputValues((prevValues) => {
            if (checked) {
              // Add the value to the array if checked
              return { ...prevValues, [name]: [...(prevValues[name] || []), value] };
            } else {
              // Remove the value from the array if unchecked
              return {
                ...prevValues,
                [name]: (prevValues[name] || []).filter((val) => val !== value),
              };
            }
          });
        } else {
        setInputValues({
          ...inputValues,
          [name]: value,
        });
      }
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

        <label>
  Device Payment Plan:
  <input
    type="radio"
    value="TRUE"
    name="device_payment_plan"
    checked={inputValues.device_payment_plan === 'TRUE'}
    onChange={handleInputChange}
  />
  True
</label>

<label>
  <input
    type="radio"
    value="FALSE"
    name="device_payment_plan"
    checked={inputValues.device_payment_plan === 'FALSE'}
    onChange={handleInputChange}
  />
  False
</label>

<label>
  <input
    type="radio"
    value="BLANK"
    name="device_payment_plan"
    checked={inputValues.device_payment_plan === ''}
    onChange={handleInputChange}
  />
  None
</label>

        <label>Credit Card: <input type="text" value={inputValues.credit_card} name="credit_card" onChange={handleInputChange} /></label>
        <label>Credit Card Type: <input type="text" value={inputValues.credit_card_type} name="credit_card_type" onChange={handleInputChange} /></label>
        <label>Account Last Payment Date: <input type="text" value={inputValues.account_last_payment_date} name="account_last_payment_date" onChange={handleInputChange} /></label>
        <label>Address: <input type="text" name="address" value={inputValues.address} onChange={handleInputChange} /></label>
        <label>State: <input type="text" name="state" value={inputValues.state} onChange={handleInputChange} /></label>
        <label>Postal Code: <input type="text" name="postal_code" value={inputValues.postal_code} onChange={handleInputChange} /></label>

        <label>Service Type: 
        <label>
  Wireless
  <input
    type="checkbox"
    name="ServiceTypes"
    value="Wireless"
    checked={inputValues.ServiceTypes.includes('Wireless')}
    onChange={handleInputChange}
  />
</label>

<label>
  Fiber
  <input
    type="checkbox"
    name="ServiceTypes"
    value="Fiber"
    checked={inputValues.ServiceTypes.includes('Fiber')}
    onChange={handleInputChange}
  />
</label>
    <label>
      Both
      <input
        type="radio"
        name="ServiceTypes"
        value="Both"
        checked={inputValues.ServiceTypes.includes('Both')}
        onChange={handleInputChange}
      />
    </label>
          </label>

        <button className="search-box" onClick={handleFilterSubmit}>Search</button>
      </div>
    </div>


  );
};

export default FilterOverlay;