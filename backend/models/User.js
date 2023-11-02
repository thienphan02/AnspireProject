import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../config/connection.js';

import Login from './Login.js'; //foreign key from Login table

//create User table
const User = sequelize.define('User', {
	id: {
		type: DataTypes.UUID,
		defaultValue: DataTypes.UUIDV4, //creates new UUID value when inserting into db
		primaryKey: true,
		allowNull: false,
	},
	Name: {
		type: DataTypes.STRING(30),
		allowNull: true,
	},
	Email: {
		type: DataTypes.STRING(30),
		allowNull: true,
	},
	Address: {
		type: DataTypes.STRING(30),
		allowNull: true,
	},
	State: {
		type: DataTypes.STRING(30),
		allowNull: true,
	},
	PostalCode: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	AccountLastPayment: {
		type: DataTypes.STRING(30),
		allowNull: true,
	},
	DevicePaymentPlan: {
		type: DataTypes.BOOLEAN,
		allowNull: true,
	},
	CreditCardNumber: {
    type: DataTypes.STRING(16), // Assuming credit card numbers as strings for accuracy
    allowNull: true,
  },
  CreditCardType: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
}, 	{
	timestamps: false,
	tableName: 'User',
});

export default User;