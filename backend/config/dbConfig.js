const HOST = "anspire.database.windows.net";
const USER = "group4";
const PASSWORD = "olemi$$2023";
const DB = "anspireDB";
const dialect = "mssql";
const pool = {
	max: 5,
	min: 0,
	acquire: 30000,
	idle: 10000
};

export default {
	HOST,
	USER,
	PASSWORD,
	DB,
	dialect,
	pool
};