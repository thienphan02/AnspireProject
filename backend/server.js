import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
//import dbConnection from './config/dbConfig.js' // Via this import, it sets up the connection, not using this currently, might not need to.

const app = express();
app.use(cors({
    origin: ["http://localhost:5173"],
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true,
    optionsSuccessStatus: 204
}));
app.use(cookieParser());
app.use(express.json());

import sql from 'mssql'
let con;
async function connectToDatabase() {
    try {
      con = await sql.connect({
        server: 'anspire.database.windows.net',
        database: 'anspireDB',
        user: 'group4',
        password: 'olemi$$2023',
        options: {
          encrypt: true,
          enableArithAbort: true
        }
      });
      console.log('Connected to the database');
    } catch (error) {
      console.error('Error connecting to the database:', error);
    }
  }
await connectToDatabase(); // Make a global connection with con as the connection variable

app.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const result = await con.query`SELECT * FROM admin WHERE email = ${email}`;
        const admin = result.recordset[0];

        if (admin) {
            const passwordMatch = await bcrypt.compare(password, admin.password);
            if (passwordMatch) {
                const id = admin.id;
                const token = jwt.sign({ role: 'admin', id }, 'jwt-secret-key', { expiresIn: '1d' });
                res.cookie('token', token);
                return res.json({ Status: 'Success' });
            } else {
                return res.json({ Status: 'Error', Error: 'Wrong Email or Password' });
            }
        } else {
            return res.json({ Status: 'Error', Error: 'Admin not found' });
        }
    } catch (err) {
        console.error('Error in running query:', err);
        return res.json({ Status: 'Error', Error: 'Error in running query' });
    }
});

app.post('/customerLogin', async (req, res) => {
    try {
      const query = `SELECT id, email, password FROM users WHERE email = @email`;
      const request = con.request().input('email', sql.VarChar, req.body.email);
      const result = await request.query(query);

      if (result.recordset.length > 0) {
        const user = result.recordset[0];
  
        if (await bcrypt.compare(req.body.password, user.password)) {
          const id = user.id;
          const token = jwt.sign({ role: "admin", id }, "jwt-secret-key", { expiresIn: '1d' });
          res.cookie('token', token);
          return res.json({ Status: "Success" });
        } else {
          return res.json({ Status: "Error", Error: "Wrong Email or Password" });
        }
      } else {
        return res.json({ Status: "Error", Error: "User not found" });
      }
    } catch (err) {
      console.error("Error in running query:", err);
      return res.json({ Status: "Error", Error: "Error in running query" });
    }
  });

  app.get('/getCustomer', async (req, res) => {
    try {
        const result = await con.request().query('SELECT * FROM combined_data');
        return res.json({ Status: 'Success', Result: result.recordset });
    } catch (err) {
        console.error('Error fetching customer data from the database:', err);
        return res.json({ Error: 'Get customer error in SQL' });
    }
});

app.get('/get/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const result = await con.query`SELECT * FROM combined_data WHERE id = ${id}`;

        if (result.recordset.length === 0) {
            return res.json({ Status: 'Data not found', Result: [] });
        }

        return res.json({ Status: 'Success', Result: result.recordset });
    } catch (err) {
        console.error('Database error:', err);
        return res.json({ Status: 'Error', Error: 'Get customer error in sql' });
    }
});

app.put('/update/:id', async (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;

    try {
        // Fetch the current data from the database before the update
        const result = await con.request()
            .input('id', sql.NVarChar(50), id)
            .query('SELECT * FROM combined_data WHERE ID = @id');

        const oldData = result.recordset[0];

        // Update the data in the database
        await con.request()
            .input('id', sql.NVarChar(50), id)
            .input('name', sql.NVarChar(30), updatedData.Name)
            .input('email', sql.NVarChar(30), updatedData.Email)
            .input('device_payment_plan', sql.NVarChar(30), updatedData.DevicePaymentPlan)
            .input('credit_card', sql.NVarChar(30), updatedData.CreditCardNumber)
            .input('credit_card_type', sql.NVarChar(30), updatedData.CreditCardType)
            .input('account_last_payment_date', sql.DateTimeOffset, updatedData.AccountLastPayment)
            .input('address', sql.NVarChar(30), updatedData.Address)
            .input('state', sql.NVarChar(30), updatedData.State)
            .input('postal_code', sql.NVarChar(30), updatedData.PostalCode)
            .query(`
                UPDATE combined_data
                SET
                Name = @name,
                Email = @email,
                DevicePaymentPlan = @device_payment_plan,
                CreditCardNumber = @credit_card,
                CreditCardType = @credit_card_type,
                AccountLastPayment = @account_last_payment_date,
                Address = @address,
                State = @state,
                PostalCode = @postal_code
                WHERE id = @id
            `);

        // Fetch the current timestamp from the database
        const timestampResult = await con.request().query('SELECT CURRENT_TIMESTAMP AS timestamp');
        const timestamp = timestampResult.recordset[0].timestamp;

        // Log the edit history entries for the updated fields
        const editHistory = getEditHistory(oldData, updatedData, timestamp);

        if (editHistory.length > 0) {
            editHistory.forEach(async entry => {
                await con.request()
                    .input('edited_field1', sql.VarChar(255), entry.old_value)
                    .input('edited_table1', sql.VarChar(255), entry.edited_field)
                    .input('new_value', sql.VarChar(255), entry.new_value)
                    .input('timestamp', sql.DateTime, entry.timestamp)
                    .query(`
                        INSERT INTO edit_history (edited_table, edited_field, new_value, timestamp)
                        VALUES (@edited_table1, @edited_field1, @new_value, @timestamp)
                    `);
            });
        }

        return res.json({ Status: "Success" });
    } catch (err) {
        console.error("Error updating customer:", err);
        return res.json({ Status: "Error", Error: "Error updating customer" });
    }
});

// Function to handle inserting a date into a string for edit_history (turns date to string)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}/${year}`;
}

// Function to determine the edited fields and their new values by comparing old and updated data
function getEditHistory(oldData, updatedData, timestamp) {
    const editHistory = [];

    for (const key in updatedData) {
        if (key !== 'id' && oldData[key] !== updatedData[key]) {
            let formattedNewValue = oldData[key];

            // Check if the current key is the one representing the date field
            if (key === 'AccountLastPayment') {
                // Parse the new date value into a Date object  
                const newDate = new Date(formattedNewValue);
                // Format the date as 'YYYY-MM-DD'
                formattedNewValue = formatDate(newDate);
            }

            editHistory.push({
                edited_field: key,       // Set edited_field to the field name
                old_value: formattedNewValue,
                new_value: updatedData[key], // Set new_value to the new value
                timestamp: timestamp
            });
        }
    }

    return editHistory;
}

app.get('/editHistory', async (req, res) => {
    try {
        const result = await con.query`SELECT edited_table, edited_field, new_value, timestamp FROM edit_history`;

        return res.json({ Status: 'Success', EditHistory: result.recordset });
    } catch (err) {
        console.error('Error fetching edit history:', err);
        return res.status(500).json({ Error: 'Error fetching edit history' });
    }
});

app.delete('/delete/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const result = await con.query`DELETE FROM combined_data WHERE id = ${id}`;
        return res.json({ Status: 'Success' });
    } catch (err) {
        console.error('Error in running delete query:', err);
        return res.json({ Status: 'Error', Error: 'Error in running delete query' });
    }
});

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ Error: "You are no Authenticated" });
    } else {
        jwt.verify(token, "jwt-secret-key", (err, decoded) => {
            if (err) return res.json({ Error: "Token wrong" });
            req.role = decoded.role;
            req.id = decoded.id;
            next();
        })
    }
}

app.get('/dashboard', verifyUser, (req, res) => {
    return res.json({ Status: "Success", role: req.role, id: req.id })
})
app.get('/userDashboard', verifyUser, (req, res) => {
    return res.json({ Status: "Success", role: req.role, id: req.id })
})

app.get('/adminCount', (req, res) => {
    const sql = "Select count(id) as admin from admin";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Error: "Error in runnig query" });
        return res.json(result);
    })
})
app.get('/customerCount', (req, res) => {
    const sql = "Select count(id) as users from combined_data";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Error: "Error in runnig query" });
        return res.json(result);
    })
})

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({ Status: "Success" });
})


app.post('/add', async (req, res) => {
    const {
        Name,
        Email,
        DevicePaymentPlan,
        CreditCardNumber,
        CreditCardType,
        AccountLastPayment,
        Address,
        State,
        PostalCode
    } = req.body;

    try {
        const result = await con.query`
            INSERT INTO combined_data (
                id,
                Name,
                Email,
                DevicePaymentPlan,
                CreditCardNumber,
                CreditCardType,
                AccountLastPayment,
                Address,
                State,
                PostalCode
            ) VALUES (NEWID(), ${Name}, ${Email}, ${DevicePaymentPlan}, ${CreditCardNumber}, ${CreditCardType}, ${AccountLastPayment}, ${Address}, ${State}, ${PostalCode})`;
        
        return res.json({ Status: 'Success' });
    } catch (err) {
        console.error('Error in running query:', err);
        return res.json({ Status: 'Error', Error: 'Error in running query' });
    }
});

app.listen(8081, () => {
    console.log("Running")
})