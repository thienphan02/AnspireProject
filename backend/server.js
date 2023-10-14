import express from 'express'
import mysql from 'mysql'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const app = express();
app.use(cors({
    origin: ["http://localhost:5173"],
        methods: ["POST", "GET", "PUT"],
        credentials: true
}));
app.use(cookieParser());
app.use(express.json());

const con = mysql.createConnection ({
    host: "localhost",
    port: "3307",
    user: "root",
    password: "",
    database: "signup"
})

con.connect(function(err) {
    if(err) {
        console.log("Error in Connection:" , err)
    } else {
        console.log("Connected")
    }
})

// app.post('/login', (req, res) => {
//     const sql = "SELECT * FROM admin Where email = ? AND password = ?";
//     con.query(sql, [req.body.email, req.body.password], (err, result) => {
//         if(err) return res.json({Status: "Error", Error: "Error in running query"});
//         if(result.length > 0) {
//             return res.json({Status: "Success"})
//         } else {
//             return res.json({Status: "Error", Error: "Wrong Email or Password"});
//         }
//     })
// })

app.post('/login', (req, res) => {
    const sql = "SELECT * FROM admin Where email = ? AND  password = ?";
    con.query(sql, [req.body.email, req.body.password], (err, result) => {
        if(err) return res.json({Status: "Error", Error: "Error in runnig query"});
        if(result.length > 0) {
            const id = result[0].id;
            const token = jwt.sign({role: "admin"}, "jwt-secret-key", {expiresIn: '1d'});
            res.cookie('token', token);
            return res.json({Status: "Success"})
        } else {
            return res.json({Status: "Error", Error: "Wrong Email or Password"});
        }
    })
})

// app.post('/login', (req, res) => {
//     const email = req.body.email;
//     const password = req.body.password;

//     const sql = "SELECT * FROM admin WHERE email = ?";
//     con.query(sql, [email], (err, results) => {
//         if (err) {
//             console.error("Error in running query:", err);
//             return res.json({ Status: "Error", Error: "Error in running query" });
//         }

//         if (results.length === 0) {
//             return res.json({ Status: "Error", Error: "Wrong Email or Password" });
//         }

//         const user = results[0];

//         bcrypt.compare(password, user.password, (bcryptErr, bcryptResult) => {
//             if (bcryptErr) {
//                 console.error("Error comparing passwords:", bcryptErr);
//                 return res.json({ Status: "Error", Error: "Error comparing passwords" });
//             }

//             if (bcryptResult) {
//                 const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '1h' });
//                 return res.json({ Status: "Success", Token: token });
//             } else {
//                 return res.json({ Status: "Error", Error: "Wrong Email or Password" });
//             }
//         });
//     });
// });

app.post('/customerLogin', (req, res) => {
    const sql = "SELECT * FROM users Where email = ? AND  password = ?";
    con.query(sql, [req.body.email, req.body.password], (err, result) => {
        if(err) return res.json({Status: "Error", Error: "Error in runnig query"});
        if(result.length > 0) {
            const id = result[0].id;
            const token = jwt.sign({role: "admin"}, "jwt-secret-key", {expiresIn: '1d'});
            res.cookie('token', token);
            return res.json({Status: "Success"})
        } else {
            return res.json({Status: "Error", Error: "Wrong Email or Password"});
        }
    })
})


// app.post('/customerLogin', (req, res) => {
//     const sql = "SELECT * FROM users Where email = ?";
//     con.query(sql, [req.body.email], (err, result) => {
//         if(err) return res.json({Status: "Error", Error: "Error in runnig query"});
//         if(result.length > 0) {
//             bcrypt.compare(req.body.password.toString(), result[0].password, (err, response)=> {
//                 if(err) return res.json({Error: "password error"});
//                 if(response) {
//                     const token = jwt.sign({role: "users", id: result[0].id}, "jwt-secret-key", {expiresIn: '1d'});
//                     res.cookie('token', token);
//                     return res.json({Status: "Success", id: result[0].id})
//                 } else {
//                     return res.json({Status: "Error", Error: "Wrong Email or Password"});
//                 }
                
//             })
            
//         } else {
//             return res.json({Status: "Error", Error: "Wrong Email or Password"});
//         }
//     })
// })

app.get('/getCustomer', (req, res) => {
    const sql = "SELECT * FROM testing"
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Get customer error in sql"})
        return res.json({Status: "Success", Result: result})
    })
})

app.get('/get/:id', (req, res) =>{
    const id = req.params.id;

    
    const sql = "SELECT * FROM testing WHERE id = ?";
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
    const sql = "UPDATE testing SET postalCode = ? WHERE id = ?"
    con.query(sql, [ req.body.postalCode, id], (err, result) => {

        if(err) return res.json({Error: "Update customer error in sql"})
        return res.json({Status: "Success"})
    })
})

app.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "Delete FROM testing WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if(err) return res.json({Error: "delete customer error in sql"});
        return res.json({Status: "Success"})
    })
})

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if(!token) {
        return res.json({Error: "You are no Authenticated"});
    } else {
        jwt.verify(token, "jwt-secret-key", (err, decoded) => {
            if(err) return res.json({Error: "Token wrong"});
            req.role = decoded.role;
            req.id = decoded.id;
            next();
        } )
    }
}

app.get('/dashboard',verifyUser, (req, res) => {
    return res.json({Status: "Success", role: req.role, id: req.id})
})
app.get('/userDashboard',verifyUser, (req, res) => {
    return res.json({Status: "Success", role: req.role, id: req.id})
})

app.get('/adminCount', (req, res) => {
    const sql = "Select count(id) as admin from admin";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Error in runnig query"});
        return res.json(result);
    })
})
app.get('/customerCount', (req, res) => {
    const sql = "Select count(id) as users from testing";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Error in runnig query"});
        return res.json(result);
    })
})

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({Status: "Success"});
})

app.post('/add', (req, res) => {

    const bcrypt = require('bcrypt');
 
    const {
        ID,
        name,
        email,
        serviceType,
        devicePaymentPlan,
        creditCardNumber,
        creditCardType,
        accountLastPaymentDate,
        address,
        state,
        postalCode
    } = req.body;

    const sql = `
        INSERT INTO testing (
            ID,
            name,
            email,
            serviceType,
            devicePaymentPlan,
            creditCardNumber,
            creditCardType,
            accountLastPaymentDate,
            address,
            state,
            postalCode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    con.query(
        sql,
        [
            ID,
            name,
            email,
            serviceType,
            devicePaymentPlan,
            creditCardNumber,
            creditCardType,
            accountLastPaymentDate,
            address,
            state,
            postalCode
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
}) 

app.listen(8081, ()=> {
    console.log("Running")
})