import multer from 'multer';
import fs from 'fs';
import Papa from 'papaparse';
import sql from 'mssql';
import { error } from 'console';

// ID, Name, Email (1) (No Unique Identifiers)
// ID, ServiceType, DevicePayment, CreditCard, CreditCardType (2) (ServiceType/Device/CreditCard)
// Name, Email, AccountLastPaymentDate, Address, State, PostalCode (3) (Date/Address/State/PostalCode)

const upload = multer({ dest: 'uploads/' });

function formatDate(dateStr) {
    if (!dateStr) return null; // return null if the date string is empty or undefined

    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const [month, day, year] = parts;
        return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
    } else {
        console.error(`Invalid date format: ${dateStr}`);
        return null;
    }
}

const parseCSV = (filePath) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return new Promise((resolve, reject) => {
        Papa.parse(fileContent, {
            header: true,
            complete: (result) => { // Determine which of the 3 types of CSV files it is.
                let typeIdentifier;
                if(result.meta.fields.includes('Service Type')) {
                    typeIdentifier = 2;
                } else if(result.meta.fields.includes('Address')) {
                    typeIdentifier = 3;
                } else {
                    typeIdentifier = 1;
                }

                resolve({...result, typeIdentifier})
            },
            error: reject
        });
    });
};

const mergeAndInsertData = async (data, type, con) => {
    console.log("typeID: ", type)
    switch(type) {
        case 1:
            for(const record of data) { // Loop through every line in the file of type 1
                const ifExistsQuery = `SELECT * FROM combined_data WHERE ID = @ID`
                try {
                    const request = await con.request()
                    .input('ID', sql.NVarChar(50), record.Id)
                    .query(ifExistsQuery);
                    if(request.recordset.length > 0) { // Update the fields if exists
                        const updateQuery = `UPDATE combined_data SET name = @Name, email = @Email
                        WHERE ID = @ID`
                        await con.request()
                        .input('ID', sql.NVarChar(50), record.Id)
                        .input('Name', sql.NVarChar(30), record.Name)
                        .input('Email', sql.VarChar(100), record.email)
                        .query(updateQuery);
                    } else { // Insert into DB
                        const insertQuery = `Insert into combined_data (ID, name, email) values (@ID, @Name, @Email)`
                        await con.request()
                        .input('ID', sql.NVarChar(50), record.Id)
                        .input('Name', sql.NVarChar(30), record.Name)
                        .input('Email', sql.VarChar(100), record.email)
                        .query(insertQuery);
                    }
                } catch(err) {
                    console.log("err: ", err);
                }
            }
            break;
        case 2:
            for(const record of data) { // This one is most complicated, return to later
                const ifExistsQuery = `SELECT * FROM combined_data WHERE ID = @ID`
                const request = await con.request()
                .input('ID', record.Id)
                .query(ifExistsQuery);
                if(request.recordset.length > 0) { // Update the existing user
                    const updateQuery = `UPDATE combined_data set device_payment_plan = @device_payment_plan,
                    credit_card = @credit_card, credit_card_type = @credit_card_type WHERE ID = @ID`

                    await con.request()
                    .input('ID', record.Id)
                    .input('credit_card', record['Credit Card Number'])
                    .input('credit_card_type', record['Credit Card Type'])
                    .input('device_payment_plan', record['Device Payment Plan'])
                    .query(updateQuery);
                    // Check if user has service
                    const serviceQuery = `SELECT * from UserServices WHERE UserID = @UserID and ServiceID = @ServiceID`
                    const serviceID = record['Service Type'] === 'Wireless' ? 0 : 1;

                    const serviceRequest = await con.request()
                    .input('UserID', record.Id)
                    .input('ServiceID', serviceID)
                    .query(serviceQuery);
                    if(serviceRequest.recordset.length > 0) {
                        continue; // Skip this line since they have it
                    } else {
                        const insertServiceQuery = `Insert Into UserServices (UserID, ServiceID) values (@UserID, @ServiceID)`
                        await con.request()
                        .input('UserID', record.Id)
                        .input('ServiceID', serviceID)
                        .query(insertServiceQuery);
                    }
                } else { // Update instead of insert
                    const insertQuery = `Insert Into UserServices (ID, device_payment_plan, credit_card, credit_card_type) 
                    values (@ID, @device_payment_plan, @credit_card, @credit_card_type)`

                    await con.request()
                    .input('ID', record.Id)
                    .input('credit_card', record['Credit Card Number'])
                    .input('credit_card_type', record['Credit Card Type'])
                    .input('device_payment_plan', record['Device Payment Plan'])
                    .query(insertQuery);

                    // Check if user has service
                    const serviceQuery = `SELECT * from UserServices WHERE UserID = @UserID and ServiceID = @ServiceID`
                    const serviceID = record['Service Type'] === 'Wireless' ? 0 : 1;
                    
                    const serviceRequest = await con.request()
                    .input('UserID', record.Id)
                    .input('ServiceID', serviceID)
                    .query(serviceQuery);
                    if(serviceRequest.recordset.length > 0) {
                        continue; // Skip this line since they have it
                    } else {
                        const insertServiceQuery = `Insert Into UserServices (UserID, ServiceID) values (@UserID, @ServiceID)`
                        await con.request()
                        .input('UserID', record.Id)
                        .input('ServiceID', serviceID)
                        .query(insertServiceQuery);
                    }
                }
            }
            break;
        case 3:
            for(const record of data) {
                const ifExistsQuery = `SELECT * from combined_data WHERE name = @Name`
                const request = await con.request()
                .input('Name', sql.NVarChar(30), record.Name)
                .query(ifExistsQuery);

                if(request.recordset.length > 0) {
                    const updateQuery = `UPDATE combined_data SET email = @email, address = @Address, 
                    account_last_payment_date = @account_last_payment_date, state = @state, postal_code = @postal_code
                    WHERE name = @Name`;
                    await con.request()
                    .input('email', record.email)
                    .input('Address', record.Address)
                    .input('account_last_payment_date', record['Account Last Payment Date'])
                    .input('state', record.State)
                    .input('postal_code', record['Postal Code'])
                    .input('Name', record.Name)
                    .query(updateQuery)

                } else { // Continue because no matching Name found
                    continue;
                }
            }
            break;
        default:
            console.log("unknown");
            break;
    }
}

const processCSVUpload = async (req, res, con) => {
    try {
        for (const file of req.files) {
            const filePath = file.path;
            const parsedData = await parseCSV(filePath);
            console.log("type: ", parsedData.typeIdentifier)
            await mergeAndInsertData(parsedData.data, parsedData.typeIdentifier, con);
        }
        res.send('Files processed and data inserted into the database.');
    } catch (error) {
        console.error('Error processing files:', error);
        res.status(500).send('Error processing files');
    }
};

export { upload, processCSVUpload }

