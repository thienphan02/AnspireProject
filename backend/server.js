import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

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
                return res.json({ Status: 'Success', Role: 'admin' }); // assign admin role
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
          return res.json({ Status: "Success", Role: 'user' });
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
        const query = `SELECT ID, name, email, address, state, postal_code, account_last_payment_date, device_payment_plan, credit_card, credit_card_type,
        STUFF((
            SELECT ',' + CAST(ServiceType AS VARCHAR(MAX)) FROM UserServices us
            INNER JOIN Service s ON us.ServiceID = s.ServiceID WHERE us.UserID = cd.ID
            FOR XML PATH(''), TYPE).value('.', 'VARCHAR(MAX)'), 1, 1, '') AS ServiceTypes
    FROM combined_data cd
    LEFT OUTER JOIN UserServices ON cd.ID = UserServices.UserID
    Left Outer JOIN Service ON UserServices.ServiceID = Service.ServiceID
    GROUP BY ID, name, email, address, state, postal_code, account_last_payment_date, device_payment_plan, credit_card, credit_card_type`
        const result = await con.request().query(query);
        return res.json({ Status: 'Success', Result: result.recordset });
    } catch (err) {
        console.error('Error fetching customer data from the database:', err);
        return res.json({ Error: 'Get customer error in SQL' });
    }
});

app.get('/get/:id', async (req, res) => {
    const id = req.params.ID;

    try {
        const result = await con.query`SELECT * FROM combined_data WHERE ID = ${id}`;

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
    const id = req.params.ID;
    const updatedData = req.body;

    try {
        // Fetch the current data from the database before the update
        const result = await con.request()
            .input('id', sql.NVarChar(50), id)
            .query('SELECT * FROM combined_data WHERE ID = @id');

        const oldData = result.recordset[0];

        // Update the data in the database
        await con.request()
            .input('id', sql.NVarChar(50), ID)
            .input('name', sql.NVarChar(30), updatedData.name)
            .input('email', sql.NVarChar(30), updatedData.email)
            .input('device_payment_plan', sql.NVarChar(30), updatedData.device_payment_plan)
            .input('credit_card', sql.NVarChar(30), updatedData.credit_card)
            .input('credit_card_type', sql.NVarChar(30), updatedData.credit_card_type)
            .input('account_last_payment_date', sql.DateTimeOffset, updatedData.account_last_payment_date)
            .input('address', sql.NVarChar(30), updatedData.address)
            .input('state', sql.NVarChar(30), updatedData.state)
            .input('postal_code', sql.NVarChar(30), updatedData.postal_code)
            .query(`
                UPDATE combined_data
                SET
                name = @name,
                email = @email,
                device_payment_plan = @device_payment_plan,
                credit_card = @credit_card,
                credit_card_type = @credit_card_type,
                account_last_payment_date = @account_last_payment_date,
                address = @address,
                state = @state,
                postal_code = @postal_code
                WHERE ID = @id
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

app.get('/adminCount', async (req, res) => {
    try {
        const query = 'SELECT COUNT(id) AS admin FROM admin';
        const result = await con.query(query);

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error running query:', err);
        res.status(500).json({ Error: 'Error in running query' });
    }
});

app.get('/customerCount', async (req, res) => {
    try {
        const query = "Select COUNT(ID) as users from combined_data";
        const result = await con.query(query);

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error running query:', err);
        res.status(500).json({ Error: 'Error in running query' });
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({ Status: "Success" });
})


app.post('/add', async (req, res) => {
    const {
        name,
        email,
        device_payment_plan,
        credit_card,
        credit_card_type,
        account_last_payment_date,
        address,
        state,
        postal_code
    } = req.body;

    try {
        const result = await con.query`
            INSERT INTO combined_data (
                ID,
                name,
                email,
                device_payment_plan,
                credit_card,
                credit_card_type,
                account_last_payment_date,
                address,
                state,
                postal_code
            ) VALUES (NEWID(), ${name}, ${email}, ${device_payment_plan}, ${credit_card}, ${credit_card_type}, ${account_last_payment_date}, ${address}, ${state}, ${postal_code})`;
        
        return res.json({ Status: 'Success' });
    } catch (err) {
        console.error('Error in running query:', err);
        return res.json({ Status: 'Error', Error: 'Error in running query' });
    }
});

app.post('/advanceLogin', async(req, res) => {
    try {
        const query = `Select * FROM advance_user WHERE email = @email`;
        const request = con.request().input('email', sql.VarChar, req.body.email);
        const result = await request.query(query);

        if(result.recordset.length > 0) {
            const user = result.recordset[0];

            if(await bcrypt.compare(req.body.password, user.password)) {
                const id = user.id;
                const token = jwt.sign({role: "admin", id }, "jwt-secret-key", {expiresIn: '1d' });
                res.cookie('token', token);
                return res.json({Status: "Success", Role: 'advanceUser' });
            } else {
                return res.json({Status: "Error", Error: "Wrong Email or Password" });
            }
        } else {
          return res.json({ Status: "Error", Error: "User not found" });
        }
      } catch (err) {
        console.error("Error in running query:", err);
        return res.json({ Status: "Error", Error: "Error in running query" });
      }
    });

    app.get('/getUser', async (req, res) => {
        try {
            const result = await con.request().query('SELECT id, email, role FROM users');
            
            return res.json({ Status: "Success", Result: result.recordset });
        } catch (err) {
            console.error("Get customer error in SQL:", err);
            return res.status(500).json({ Error: "Get customer error in SQL" });
        }
    });

    app.get('/getAdvanceUser', async (req, res) => {
        try {
            const result = await con.request().query('SELECT id, email, role FROM advance_user');
            
            return res.json({ Status: "Success", Result: result.recordset });
        } catch (err) {
            console.error("Get advance user error in SQL:", err);
            return res.status(500).json({ Error: "Get advance user error in SQL" });
        }
    });

app.post('/demoteUser/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const checkAdvanceUserQuery = 'SELECT * FROM advance_user WHERE id = @id'
        const checkAdvanceUserResult = await con.request().input('id', sql.Int, id).query(checkAdvanceUserQuery);

        
        if (checkAdvanceUserResult.recordset.length === 0) {
            return res.json({ Error: "Advance User not found." });
        }

        const userToDemote = checkAdvanceUserResult.recordset[0];

        // Update user's role and move password
        const insertUserQuery = "INSERT INTO users (email, role, password) VALUES (@email, 'user', @password)";
        await con.request()
        .input('email', sql.VarChar(30), userToDemote.email)
        .input('password', sql.NVarChar(60), userToDemote.password)
        .query(insertUserQuery);

        // Delete advance_user that was moved
        const deleteAdvanceUserQuery = "DELETE FROM advance_user WHERE id = @id"
        await con.request()
        .input('id', sql.Int, id)
        .query(deleteAdvanceUserQuery);

        return res.json({ Status: "Success", Message: "User demoted successfully." });
    } catch (err) {
        console.error("Demotion failed:", err);
        return res.status(500).json({ Error: "Demotion failed." });
    }
});

app.post('/promoteUser/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // Get the user from the 'user' table
        const checkRegularUserQuery = "SELECT * FROM users WHERE id = @id";
        const checkRegularUserResult = await con.request()
        .input('id', sql.Int, id)
        .query(checkRegularUserQuery);

        if (checkRegularUserResult.recordset.length === 0) {
            return res.json({ Error: "User not found or not a regular user." });
        }

        // Promote user to 'advance_user' table
        const userToPromote = checkRegularUserResult.recordset[0];
        const insertAdvanceUserQuery = "INSERT INTO advance_user (email, role, password) VALUES (@email, 'advance_user', @password)";
        const insertAdvanceUserResult = await con.request()
        .input('email', sql.VarChar(30), userToPromote.email)
        .input('password', sql.NVarChar(60), userToPromote.password)
        .query(insertAdvanceUserQuery);

        // Delete user from the 'users' table
        const deleteRegularUserQuery = "DELETE FROM users WHERE id = @id";
        await con.request()
        .input('id', sql.Int, id)
        .query(deleteRegularUserQuery);
    
        return res.json({ Status: "Success", Message: "User promoted to advance user successfully." });
    } catch (err) {
        console.error("Promotion failed:", err);
        return res.status(500).json({ Error: "Promotion failed." });
    }
});

app.post('/createUser', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    try {

        console.log("email", email);
        console.log("password ", password);

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("hashed password");
        const createUserQuery = "INSERT INTO users (email, role, password) VALUES (@email, 'user', @password)";
        const result = await con.request()
        .input('email', sql.VarChar(30), email)
        .input('password', sql.NVarChar(60), hashedPassword)
        .query(createUserQuery);

        res.json({ Status: 'Success', Message: 'User created successfully' });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ Status: 'Error', Error: 'Error creating user' });
    }
});

app.post('/filteredSearch', async (req, res) => {
    let {
        ID, 
        name,
        email,
        device_payment_plan,
        credit_card,
        credit_card_type,
        account_last_payment_date,
        address,
        state,
        postal_code
    } = req.body;
    try {
        const query = `SELECT * FROM combined_data 
        WHERE ID like @ID and name like @name and email like @email 
        and device_payment_plan like @device_payment_plan and credit_card like @credit_card 
        and credit_card_type like @credit_card_type 
        and account_last_payment_date >= @account_last_payment_range
        and address like @address and state like @state and postal_code like @postal_code`;
        ID = '%' + ID + '%'; // Create one for each parameter so that it searches for contains, not exact match.
        name = '%' + name + '%';
        email = '%' + email + '%';
        device_payment_plan = '%' + device_payment_plan + '%';
        credit_card = '%' + credit_card + '%';
        credit_card_type = '%' + credit_card_type + '%';

        // Handle the date to make it a valid type
        let account_last_payment_date_range = '0001-01-01'; // Sets default value of low date
        if(account_last_payment_date) { // Checks if it is null or not (if null, set as lowest date)
            account_last_payment_date_range = account_last_payment_date;
        }

        address = '%' + address + '%';
        state = '%' + state + '%';
        postal_code = '%' + address + '%';
        const result = await con.request()
        .input('ID', sql.NVarChar(50), ID)
        .input('name', sql.NVarChar, name)
        .input('email', sql.VarChar(100), email)
        .input('device_payment_plan', sql.NVarChar, device_payment_plan)
        .input('credit_card', sql.NVarChar, credit_card)
        .input('credit_card_type', sql.NVarChar, credit_card_type)
        .input('account_last_payment_range', account_last_payment_date_range)
        .input('address', sql.NVarChar, address)
        .input('state', sql.NVarChar, state)
        .input('postal_code', sql.NVarChar, postal_code)
        .query(query);
        return res.json({ Status: 'Success', Result: result.recordset });
    } catch (err) {
        console.error('Error Sorting:', err);
        res.status(500).json({ Status: 'Error', Error: 'Error Sorting' });
    }
})

app.listen(8081, () => {
    console.log("Running")
})