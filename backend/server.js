import express from 'express'
import mysql from 'mysql'
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

const con = mysql.createConnection({
    host: "localhost",
    port: "3307",
    user: "root",
    password: "",
    database: "signup"
})

con.connect(function (err) {
    if (err) {
        console.log("Error in Connection:", err)
    } else {
        console.log("Connected")
    }
})

app.post('/login', (req, res) => {
    const sql = "SELECT * FROM admin WHERE email = ?";

    con.query(sql, [req.body.email], (err, result) => {
        if (err) return res.json({ Status: "Error", Error: "Error in running query" });

        if (result.length > 0) {
            const admin = result[0];

            if (bcrypt.compare(req.body.password, admin.password)) {
                const id = admin.id;
                const token = jwt.sign({ role: "admin", id }, "jwt-secret-key", { expiresIn: '1d' });
                res.cookie('token', token);
                return res.json({ Status: "Success" });
            } else {
                return res.json({ Status: "Error", Error: "Wrong Email or Password" });
            }
        } else {
            return res.json({ Status: "Error", Error: "Admin not found" });
        }
    });
});

app.post('/customerLogin', (req, res) => {
    const sql = "SELECT * FROM users WHERE email = ?";

    con.query(sql, [req.body.email], (err, result) => {
        if (err) return res.json({ Status: "Error", Error: "Error in running query" });

        if (result.length > 0) {
            const users = result[0];

            if (bcrypt.compare(req.body.password, users.password)) {
                const id = users.id;
                const token = jwt.sign({ role: "admin", id }, "jwt-secret-key", { expiresIn: '1d' });
                res.cookie('token', token);
                return res.json({ Status: "Success" });
            } else {
                return res.json({ Status: "Error", Error: "Wrong Email or Password" });
            }
        } else {
            return res.json({ Status: "Error", Error: "User not found" });
        }
    });
});
// app.post('/customerLogin', (req, res) => {
//     const sql = "SELECT * FROM users Where email = ? AND  password = ?";

//     con.query(sql, [req.body.email, req.body.password], (err, result) => {
//         if (err) return res.json({ Status: "Error", Error: "Error in runnig query" });
//         if (result.length > 0) {
//             const id = result[0].id;
//             const token = jwt.sign({ role: "admin" }, "jwt-secret-key", { expiresIn: '1d' });
//             res.cookie('token', token);
//             return res.json({ Status: "Success" })
//         } else {
//             return res.json({ Status: "Error", Error: "Wrong Email or Password" });
//         }
//     })
// })

con.query("SELECT id, password FROM admin", (err, results) => {
    if (err) {
        console.error("Error fetching admin passwords from the database:", err);
    } else {
        results.forEach((admin) => {
            const id = admin.id;
            const password = admin.password;

            // Hash the password
            const hashedPassword = bcrypt.hashSync(password, 10);

            // Update the hashed password in the database
            const updateSql = "UPDATE admin SET password = ? WHERE id = ?";
            con.query(updateSql, [hashedPassword, id], (updateError, updateResult) => {
                if (updateError) {
                    console.error("Error updating password in the database:", updateError);
                } else {
                    console.log("Password updated in the database.");
                }
            });
        });
    }
});

con.query("SELECT id, password FROM users", (err, results) => {
    if (err) {
        console.error("Error fetching user passwords from the database:", err);
    } else {
        results.forEach((user) => {
            const id = user.id;
            const password = user.password;

            // Hash the password
            const hashedPassword = bcrypt.hashSync(password, 10);

            // Update the hashed password in the database
            const updateSql = "UPDATE users SET password = ? WHERE id = ?";
            con.query(updateSql, [hashedPassword, id], (updateError, updateResult) => {
                if (updateError) {
                    console.error("Error updating password in the users database:", updateError);
                } else {
                    console.log("Password updated in the users database.");
                }
            });
        });
    }
});


app.get('/getCustomer', (req, res) => {
    const sql = "SELECT * FROM combined_data"
    con.query(sql, (err, result) => {
        if (err) return res.json({ Error: "Get customer error in sql" })
        return res.json({ Status: "Success", Result: result })
    })
})

app.get('/get/:id', (req, res) => {
    const id = req.params.id;


    const sql = "SELECT * FROM combined_data WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.json({ Error: "Get customer error in sql" });
        }

        if (result.length === 0) {
            return res.json({ Status: "Data not found", Result: [] });
        }

        return res.json({ Status: "Success", Result: result });
    });
});

app.put('/update/:id', (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;

    // Fetch the current data from the database before the update
    const sqlGetOldData = "SELECT * FROM combined_data WHERE ID = ?";
    con.query(sqlGetOldData, [id], (err, result) => {
        if (err) {
            console.error("Error fetching old data:", err);
            return res.json({ Status: "Error", Error: "Error fetching old data" });
        }

        const oldData = result[0];

        // Update the data in the database
        const sqlUpdateData = `
            UPDATE combined_data
            SET
            ID = ?,
            name = ?,
            email = ?,
            service_type = ?,
            device_payment_plan = ?,
            credit_card = ?,
            credit_card_type = ?,
            account_last_payment_date = ?,
            address = ?,
            state = ?,
            postal_code = ?
            WHERE ID = ?`;

        con.query(sqlUpdateData, [
            updatedData.ID,
            updatedData.name,
            updatedData.email,
            updatedData.service_type,
            updatedData.device_payment_plan,
            updatedData.credit_card,
            updatedData.credit_card_type,
            updatedData.account_last_payment_date,
            updatedData.address,
            updatedData.state,
            updatedData.postal_code,
            id
        ], (err, result) => {
            if (err) {
                console.error("Update customer error in SQL:", err);
                return res.json({ Status: "Error", Error: "Update customer error in SQL" });
            }

            // Fetch the current timestamp from the database
            const sqlGetCurrentTimestamp = "SELECT CURRENT_TIMESTAMP() AS timestamp";
            con.query(sqlGetCurrentTimestamp, (err, timestampResult) => {
                if (err) {
                    console.error("Error fetching current timestamp:", err);
                    return res.json({ Status: "Error", Error: "Error fetching timestamp" });
                }

                const timestamp = timestampResult[0].timestamp;

                // Log the edit history entries for the updated fields
                const editHistory = getEditHistory(oldData, updatedData, timestamp);

                if (editHistory.length > 0) {
                    const sqlLogEditHistory = `
                        INSERT INTO edit_history (edited_table, edited_field, new_value, timestamp)
                        VALUES (?, ?, ?, ?)`;

                    editHistory.forEach(entry => {
                        con.query(sqlLogEditHistory, [
                            entry.edited_field, // edited_field
                            entry.old_value, // edited_table
                            entry.new_value, // new_value
                            entry.timestamp // timestamp
                        ], (err, logResult) => {
                            if (err) {
                                console.error("Error logging edit history:", err);
                            }
                        });
                    });
                }

                return res.json({ Status: "Success" });
            });
        });
    });
});

// Function to determine the edited fields and their new values by comparing old and updated data
function getEditHistory(oldData, updatedData, timestamp) {
    const editHistory = [];

    for (const key in updatedData) {
        if (oldData[key] !== updatedData[key]) {
            editHistory.push({
                edited_field: key,       // Set edited_field to the field name
                old_value: oldData[key],
                new_value: updatedData[key], // Set new_value to the new value
                timestamp: timestamp
            });
        }
    }

    return editHistory;
}

app.get('/editHistory', (req, res) => {
    // Fetch edit history entries from the database
    const sql = "SELECT edited_table, edited_field, new_value, timestamp FROM edit_history";


    con.query(sql, (err, result) => {
        if (err) {
            console.error("Error fetching edit history:", err);
            return res.status(500).json({ Error: "Error fetching edit history" });
        }

        return res.json({ Status: "Success", EditHistory: result });
    });
});

app.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "Delete FROM combined_data WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Error: "delete customer error in sql" });
        return res.json({ Status: "Success" })
    })
})

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

app.post('/add', (req, res) => {

    const {
        ID,
        name,
        email,
        service_type,
        device_payment_plan,
        credit_card,
        credit_card_type,
        account_last_payment_date,
        address,
        state,
        postal_code
    } = req.body;

    const sql = `
        INSERT INTO combined_data (
            ID,
            name,
            email,
            service_type,
            device_payment_plan,
            credit_card,
            credit_card_type,
            account_last_payment_date,
            address,
            state,
            postal_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    con.query(
        sql,
        [
            ID,
            name,
            email,
            service_type,
            device_payment_plan,
            credit_card,
            credit_card_type,
            account_last_payment_date,
            address,
            state,
            postal_code
        ],
        (err, result) => {
            if (err) {
                console.error("Error in running query:", err);
                return res.json({ Status: 'Error', Error: 'Error in running query' });
            } else {
                return res.json({ Status: 'Success' });
            }
        }
    );
});

app.listen(8081, () => {
    console.log("Running")
})