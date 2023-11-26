import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { upload, processCSVUpload } from './processCSVUpload.js'

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
            SELECT ', ' + CAST(ServiceType AS VARCHAR(MAX)) FROM UserServices us
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
    const id = req.params.id;

    try {
        const result = await con.query`SELECT * FROM combined_data WHERE ID = ${id}`;
        const services = await con.query`SELECT ServiceType FROM UserServices join Service on UserServices.ServiceID = Service.ServiceID WHERE UserID = ${id}`;

        if (result.recordset.length === 0) {
            return res.json({ Status: 'Data not found', Result: [], Services: [] });
        }

        return res.json({ Status: 'Success', Result: result.recordset, Services: services.recordset });
    } catch (err) {
        console.error('Database error:', err);
        return res.json({ Status: 'Error', Error: 'Get customer error in sql' });
    }
});

app.put('/update/:id', async (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;


    const services = req.body.Services

    await con.query`DELETE FROM UserServices WHERE UserID = ${id}` // Delete all their services and just re-add them
    if(services.length > 0) {
        services.forEach(async (element) => {
            const serviceID = element === 'Wireless' ? 0 : 1;
            await con.query`INSERT INTO UserServices (UserID, ServiceID)
            values(${id}, ${serviceID})`
        })
    }
    try {
        // Fetch the current data from the database before the update
        const result = await con.request()
            .input('id', sql.NVarChar(50), id)
            .query('SELECT * FROM combined_data WHERE ID = @id');

        const oldData = result.recordset[0];
    
        // Update the data in the database
        await con.request()
            .input('id', sql.NVarChar(50), id)
            .input('name', sql.NVarChar(30), updatedData.name)
            .input('email', sql.NVarChar(100), updatedData.email)
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
        if (key === 'Services') {
            continue;
        }
        if (key !== 'id' && oldData[key] !== updatedData[key]) {
            let formattedNewValue = oldData[key];

            // Check if the current key is the one representing the date field
            if (key === 'account_last_payment_date') {
                // Parse the new date value into a Date object  
                const newDate = new Date(formattedNewValue);
                // Format the date as 'YYYY-MM-DD'
                formattedNewValue = formatDate(newDate);
            }

            editHistory.push({
                edited_field: key, // Set edited_field to the field name
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
        await con.query`DELETE FROM UserServices WHERE UserID = ${id}`
        const result = await con.query`DELETE FROM combined_data WHERE ID = ${id}`;
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
        postal_code,
        ServiceTypes
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
            )
            OUTPUT inserted.ID 
            VALUES (NEWID(), ${name}, ${email}, ${device_payment_plan}, ${credit_card}, ${credit_card_type}, ${account_last_payment_date}, ${address}, ${state}, ${postal_code})`;

            if(ServiceTypes.length > 0) { // If its empty
                const serviceQuery = `INSERT INTO UserServices (UserID, ServiceID) values (@UserID, @ServiceID)`
                ServiceTypes.forEach(async (element) => {
                    if(element === 'Wireless') {
                        await con.request()
                        .input('UserID', result.recordset[0].ID)
                        .input('ServiceID', 0)
                        .query(serviceQuery);
                    }
                    if(element === 'Fiber') {
                        await con.request()
                        .input('UserID', result.recordset[0].ID)
                        .input('ServiceID', 1)
                        .query(serviceQuery);
                    }
                })
            }
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

        const hashedPassword = await bcrypt.hash(password, 10);
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

// COME BACK TO THIS WIP
app.post('/filteredSearch', async (req, res) => {
    let buildCondition = '';
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
        postal_code,
        ServiceTypes
    } = req.body;
    try {
        ID = '%' + ID + '%'; // Create one for each parameter so that it searches for contains, not exact match.
        name = '%' + name + '%';
        email = '%' + email + '%';
        device_payment_plan = '%' + device_payment_plan + '%';
        credit_card = '%' + credit_card + '%';
        credit_card_type = '%' + credit_card_type + '%';

        // Handle the ServiceTypes. Can contains Wireless, Fiber, or both
        let Wireless = 0; let Fiber = 0; let Both = 0
        if(ServiceTypes.length > 0) { // If its empty
            ServiceTypes.forEach((element) => {
                if(element === 'Wireless') {
                    Wireless = 1
                }
                if(element === 'Fiber') {
                    Fiber = 1
                }
                if(element === 'Both') {
                    Both = 1
                }
            })
        }

        // Conditionally build the Query around the Checkboxes
        if(Both === 1 && Fiber === 0 && Wireless === 0) { // This is the only Both condition
            buildCondition = `MAX(CASE WHEN ServiceType = 'Fiber' THEN 1 ELSE 0 END) = 1
            AND MAX(CASE WHEN ServiceType = 'Wireless' THEN 1 ELSE 0 END) = 1`
        } else if(Both === 1) { // Not only Both, still includes Both
            buildCondition = `(@Fiber = 1 AND MAX(CASE WHEN ServiceType = 'Fiber' THEN 1 ELSE 0 END) = 1)
            OR (@Wireless = 1 AND MAX(CASE WHEN ServiceType = 'Wireless' THEN 1 ELSE 0 END) = 1)`
        } else { // Doesn't include Both
            buildCondition = `(@Fiber = 1 AND MAX(CASE WHEN ServiceType = 'Fiber' THEN 1 ELSE 0 END) = 1 AND (1 = 1 AND MAX(CASE WHEN ServiceType = 'Wireless' THEN 1 ELSE 0 END) = 0))
            OR ((@Wireless = 1 AND MAX(CASE WHEN ServiceType = 'Wireless' THEN 1 ELSE 0 END) = 1) AND MAX(CASE WHEN ServiceType = 'Fiber' THEN 1 ELSE 0 END) = 0)`
        }

        // Handle the date to make it a valid type
        let account_last_payment_date_range = '0001-01-01'; 
        if(account_last_payment_date) { // Checks if it is null or not (if null, set as lowest date)
            account_last_payment_date_range = account_last_payment_date;
        }

        address = '%' + address + '%';
        state = '%' + state + '%';
        postal_code = '%' + address + '%';

        const query = `SELECT
        ID,
        name,
        email,
        address,
        state,
        postal_code,
        account_last_payment_date,
        device_payment_plan,
        credit_card,
        credit_card_type,
        STUFF((
                SELECT ', ' + CAST(ServiceType AS VARCHAR(MAX))
                FROM UserServices us
                INNER JOIN Service s ON us.ServiceID = s.ServiceID WHERE us.UserID = cd.ID
                FOR XML PATH(''), TYPE
            ).value('.', 'VARCHAR(MAX)'), 1, 1, '') AS ServiceTypes
    FROM combined_data cd
    LEFT OUTER JOIN UserServices ON cd.ID = UserServices.UserID
    LEFT OUTER JOIN Service ON UserServices.ServiceID = Service.ServiceID
    WHERE
        ID LIKE @ID
        AND name LIKE @name
        AND email LIKE @email
        AND device_payment_plan LIKE @device_payment_plan
        AND credit_card LIKE @credit_card
        AND credit_card_type LIKE @credit_card_type
        AND account_last_payment_date >= @account_last_payment_range
        AND address LIKE @address
        AND state LIKE @state
        AND postal_code LIKE @postal_code
    GROUP BY
        ID,
        name,
        email,
        address,
        state,
        postal_code,
        account_last_payment_date,
        device_payment_plan,
        credit_card,
        credit_card_type
        HAVING ${buildCondition}`;

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
        .input('Fiber', Fiber)
        .input('Wireless', Wireless)
        .query(query);
        return res.json({ Status: 'Success', Result: result.recordset });
    } catch (err) {
        console.error('Error Sorting:', err);
        res.status(500).json({ Status: 'Error', Error: 'Error Sorting' });
    }
})

app.post('/upload-csv', upload.array('files'), (req, res) => {
    try {
        console.log('CSV upload request received:', req.files);
        processCSVUpload(req, res, con);
    } catch (error) {
        console.error('Error during CSV upload:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(8081, () => {
    console.log("Running")
})