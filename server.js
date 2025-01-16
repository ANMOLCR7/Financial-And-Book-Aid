const express = require('express');
const mysql = require('mysql2/promise');  // Use promise-based mysql
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Database Connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'faba_project',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test Database Connection
(async () => {
    try {
        const connection = await db.getConnection();
        console.log('Connected to MySQL');
        connection.release();
    } catch (err) {
        console.error('Error connecting to MySQL:', err.message);
        process.exit(1);  // Exit process if DB connection fails
    }
})();

//Student Panel
// Handle Financial Aid Form Submission
app.post('/submit-financial-aid', async (req, res) => {
    console.log('Received Data:', req.body); // Log the received data for debugging

    try {
        const {
            firstName, lastName, phoneNumber, emailAddress, aidAmount, address,
            studentId, purpose, // Ensure these fields exist in your database
            username, accountEmail, bankAccountNumber, ifscCode, universityName, 
            courseName, currentYearSelect, boardName, jrFyPercentage, jrSyPercentage,
            semester1, semester2, semester3, semester4
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !emailAddress || !bankAccountNumber || !ifscCode || !purpose) {
            return res.status(400).send('Missing required fields: first name, last name, email, bank account number, IFSC code, and purpose are required.');
        }

        // SQL Query to insert data
        const query = `
            INSERT INTO financial_aid_requests 
            (first_name, last_name, phone, email, amount_requested, address, student_id, purposes, username, account_email, 
            bank_account_no, ifsc_code, university, course, year, board, jr_fy, jr_sy, sem1, sem2, sem3, sem4)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
        `;

        // Ensure all fields are valid (e.g., numbers should be passed for percentage and amount)
        const values = [
            firstName, lastName, phoneNumber, emailAddress, 
            parseFloat(aidAmount) || null, // Ensure it's a number or null
            address, studentId, purpose, username, accountEmail, bankAccountNumber, ifscCode, universityName, 
            courseName, currentYearSelect, boardName, 
            parseFloat(jrFyPercentage) || null,
            parseFloat(jrSyPercentage) || null,
            semester1 ? parseFloat(semester1) : null, // If empty, pass null
            semester2 ? parseFloat(semester2) : null, // If empty, pass null
            semester3 ? parseFloat(semester3) : null, // If empty, pass null
            semester4 ? parseFloat(semester4) : null  // If empty, pass null
        ];
        
        // Execute Query
        const [result] = await db.query(query, values);
        res.status(200).send('Financial aid application submitted successfully');
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to fetch financial aid requests for an individual student
app.get('/api/financial-aid-requests/:student_id', async (req, res) => {
    const studentId = req.params.student_id; // Get the student ID from the URL parameter
    try {
      const [rows] = await db.query(
        'SELECT * FROM financial_aid_requests WHERE student_id = ?', 
        [studentId]
      );
      res.json(rows); // Send the student's financial aid requests as JSON
    } catch (error) {
      console.error('Error fetching financial aid requests:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
// Endpoint to handle book donations
app.post('/api/book-donations', async (req, res) => {
    console.log('Received Book Donation Data:', req.body); // Log the received data

    try {
        const {
            studentId, firstName, lastName, phoneNumber, emailAddress, bookTitle, address
        } = req.body;

        // Validate required fields
        if (!studentId || !firstName || !lastName || !phoneNumber || !emailAddress || !bookTitle || !address) {
            console.error('Missing fields:', { studentId, firstName, lastName, phoneNumber, emailAddress, bookTitle, address });
            return res.status(400).json({
                error: true,
                message: 'Missing required fields: student ID, first name, last name, phone number, email, book title, and address are required.',
            });
        }

        // SQL Query to insert book donation
        const query = `
            INSERT INTO book_donations (student_id, first_name, last_name, phone_number, email_address, book_title, address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            studentId, firstName, lastName, phoneNumber, emailAddress, bookTitle, address
        ];

        // Execute Query using promise-based mysql2
        const [result] = await db.execute(query, values);

        console.log('Book donation submitted successfully:', result);
        res.status(200).json({ success: true, message: 'Donation submitted successfully' });
    } catch (error) {
        console.error('Error processing donation:', error); // Log the error
        res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
});

//admin check the donations
app.get('/api/book-donations', async (req, res) => {
    try {
        // Query to get all donations
        const query = 'SELECT * FROM book_donations';
        const [rows] = await db.execute(query);

        if (rows.length > 0) {
            res.status(200).json({
                success: true,
                donations: rows, // Send the donations as an array
            });
        } else {
            res.status(200).json({
                success: false,
                message: 'No donations found.',
            });
        }
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({
            error: true,
            message: 'Internal Server Error.',
        });
    }
});

 //Admin Panel  
//Admin dashboard
// API to fetch total students count
app.get('/api/total-students', async (req, res) => {
    try {
      const [rows] = await db.query(`SELECT COUNT(*) AS total_students FROM students WHERE status = 'Active'`);
      res.json(rows[0]);
    } catch (error) {
      console.error('Error fetching total students:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // API to fetch book donations grouped by month
app.get('/api/book-donations', async (req, res) => {
    try {
        const query = `
            SELECT DATE_FORMAT(donation_date, '%b') AS month, COUNT(*) AS donations
            FROM book_donations
            GROUP BY MONTH(donation_date)
            ORDER BY MONTH(donation_date);
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching book donations:', error);
        res.status(500).send('Internal Server Error');
    }
});


 // API endpoint to fetch pending financial aid requests data by month
app.get('/api/financial-aid', async (req, res) => {
    const query = `
        SELECT MONTH(submission_date) AS month, COUNT(*) AS pending_count
        FROM financial_aid_requests
        WHERE status = 'Pending'
        GROUP BY MONTH(submission_date)
        ORDER BY MONTH(submission_date)
    `;

    try {
        const [results] = await db.query(query); // Use promise-based query
        res.json(results); // Send the results as JSON response
    } catch (err) {
        res.status(500).json({ error: err.message }); // Send error message if query fails
    }
});


// API endpoint to fetch the number of sponsors per month
app.get('/api/sponsors', async (req, res) => {
    try {
        // Query the database for sponsor counts per month using promises
        const [rows] = await db.query(`
            SELECT MONTH(created_at) AS month, COUNT(*) AS sponsor_count
            FROM sponsors
            WHERE status = 'Active'
            GROUP BY MONTH(created_at)
            ORDER BY MONTH(created_at)
        `);
        
        // Send the results as JSON to the frontend
        res.json(rows);
    } catch (err) {
        // Handle any errors during the database query
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

    // Endpoint to get all financial aid requests
app.get('/api/financial-aid-requests', async (req, res) => {
    try {
        const [results] = await db.execute('SELECT * FROM financial_aid_requests');
        res.json(results);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get all admin financial aid requests
app.get('/api/financial-aid-requests', async (req, res) => {
    try {
        const query = `
            SELECT request_id, student_id, first_name, last_name, amount_requested, 
                   purposes, bank_account_no, ifsc_code, university, course, year, board, status, submission_date, review_date 
            FROM financial_aid_requests;
        `;
        const [rows] = await db.execute(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching financial aid requests:', error);
        res.status(500).json({ message: 'Error fetching financial aid requests' });
    }
});

// Get specific financial aid request details by ID
app.get('/api/financial-aid-requests/:id', async (req, res) => {
    const requestId = parseInt(req.params.id, 10);  // Make sure the ID is an integer
    console.log('Received requestId:', requestId);  // Check received request ID

    const query = `
        SELECT * 
        FROM financial_aid_requests 
        WHERE request_id = ?;
    `;
    console.log('Executing query:', query, 'with parameters:', [requestId]);  // Log the query

    const [rows] = await db.execute(query, [requestId]);
    console.log('Query result:', rows);  // Log the result from the query

    if (rows.length > 0) {
        res.json(rows[0]);
    } else {
        res.status(404).json({ message: 'Request not found' });
    }
});




//admin to see book donations
app.get('/api/admin/book-donations', async (req, res) => {
    // Example check for admin authentication (this depends on your auth logic)
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: true, message: 'Access denied' });
    }

    try {
        const query = 'SELECT donation_id, book_title, CONCAT(first_name, " ", last_name) AS student_name, phone_number, email_address FROM book_donations';
        const [result] = await db.execute(query);
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching book donations:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to fetch book donations.'
        });
    }
});

//admin check the donations
app.get('/api/book-donations', async (req, res) => {
    try {
        // Query to get all donations
        const query = 'SELECT * FROM book_donations';
        const [rows] = await db.execute(query);

        if (rows.length > 0) {
            res.status(200).json({
                success: true,
                donations: rows, // Send the donations as an array
            });
        } else {
            res.status(200).json({
                success: false,
                message: 'No donations found.',
            });
        }
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({
            error: true,
            message: 'Internal Server Error.',
        });
    }
});
 

//Amin manage Sponsors API Endpoint
// API endpoint to get all sponsors
app.get('/api/getSponsors', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM sponsors'); // Use async/await with the query
        res.json({ data: rows }); // Send the result as JSON
    } catch (err) {
        console.error('Error fetching sponsors:', err);
        res.status(500).send('Error fetching sponsors');
    }
});


//-----Sponsor API Endpoints-----
//<Sponsors panel(1.View-Book-Requests)
// Endpoint to fetch all financial aid requests for sponsors
app.get('/sponsor/financial-aid-requests', async (req, res) => {
    try {
        const [results] = await db.execute('SELECT * FROM financial_aid_requests WHERE status = "Pending"');
        res.json(results);  // Send the data as JSON
    } catch (error) {
        console.error('Error fetching financial aid requests:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Approve a financial aid request
app.post('/sponsor/approve-request/:requestId', async (req, res) => {
    const { requestId } = req.params;
    try {
        // Update the request status in the database
        const [result] = await db.execute(
            'UPDATE financial_aid_requests SET status = "Approved" WHERE request_id = ?',
            [requestId]
            
        );

        if (result.affectedRows === 0) {
            // If no rows were updated, it means the request ID doesn't exist
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({ message: 'Request approved successfully' });
    } catch (error) {
        console.error('Error approving request:', error);
        res.status(500).json({ error: 'Failed to approve request' });
    }
});

//Sponsors Making contribution
app.post('/sponsor/contribute/:requestId', async (req, res) => {
    const { requestId } = req.params;
    const { sponsorId, paymentAmount } = req.body;

    if (!paymentAmount || paymentAmount <= 0) {
        return res.status(400).json({ error: 'Invalid contribution amount' });
    }

    try {
        // Insert the contribution into the financial_contributions table
        await db.execute(
            'INSERT INTO financial_contributions (sponsor_id, request_id, contribution_amount) VALUES (?, ?, ?)',
            [sponsorId, requestId, paymentAmount]
        );

        // Update the contribution_amount in the financial_aid_requests table
        await db.execute(
            'UPDATE financial_aid_requests SET contribution_amount = (SELECT IFNULL(SUM(contribution_amount), 0) FROM financial_contributions WHERE request_id = ?) WHERE request_id = ?',
            [requestId, requestId]
        );

        res.status(200).json({ message: 'Contribution recorded successfully' });
    } catch (error) {
        console.error('Error recording contribution:', error);
        res.status(500).json({ error: 'Failed to record contribution' });
    }
});


// Endpoint to fetch student bank details
app.get('/sponsor/get-student-bank-details/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const [results] = await db.execute('SELECT bank_account_no, ifsc_code FROM financial_aid_requests WHERE student_id = ?', [studentId]);
        
        if (results.length > 0) {
            res.json(results[0]);  // Return the student's bank details
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        console.error('Error fetching student bank details:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

//Sponsors panel(2.Contribute Financially)
// Endpoint to make a financial contribution
app.get('/sponsor/financial-requests', async (req, res) => {
    try {
        const query = `
            SELECT 
                request_id, 
                student_id, 
                first_name, 
                last_name, 
                purposes,
                amount_requested, 
                contribution_amount,
                submission_date 
            FROM financial_aid_requests
            WHERE status = 'Approved'
        `;
        const [rows] = await db.execute(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching financial requests:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint for a sponsor to make a financial contribution
app.post('/sponsor/contribute/:requestId', async (req, res) => {
    const { requestId } = req.params;
    const { sponsorId, amount } = req.body;  // Assuming sponsorId is passed in the request body

    // Validate input
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid contribution amount' });
    }

    try {
        // Insert the contribution into the financial_contributions table
        const query = `
            INSERT INTO financial_contributions (sponsor_id, request_id, amount)
            VALUES (?, ?, ?)
        `;
        const values = [sponsorId, requestId, amount];
        await db.execute(query, values);

        // Optionally, update the financial aid request's contribution status
        await db.execute('UPDATE financial_aid_requests SET payment_status = "Contributed" WHERE request_id = ?', [requestId]);

        res.status(200).json({ message: 'Contribution successful' });
    } catch (error) {
        console.error('Error making contribution:', error);
        res.status(500).json({ error: 'Failed to make contribution' });
    }
});

//Sponsor panel(3.Profile)
// Get sponsor data by sponsor ID
app.get('/getSponsorData', async (req, res) => {
    const sponsorId = req.query.sponsorId;
  
    try {
      const connection = await mysql.createConnection(dbConfig);  // Use dbConfig for the connection
      const [rows] = await connection.execute(
        'SELECT first_name, last_name, email, phone, dob, address FROM sponsors WHERE sponsor_id = ?',
        [sponsorId]
      );
  
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Sponsor not found' });
      }
  
      res.json(rows[0]);  // Send the fetched sponsor data
      connection.end();   // Close the database connection
    } catch (error) {
      console.error('Error fetching sponsor data:', error);
      res.status(500).json({ message: 'Error fetching sponsor data' });
    }
  });
  
  // Update sponsor profile
  app.post('/updateSponsorProfile', async (req, res) => {
    const sponsorId = req.query.sponsorId;
    const { first_name, last_name, email, phone, dob, address } = req.body;
  
    try {
      const connection = await mysql.createConnection(dbConfig);
      const [result] = await connection.execute(
        'UPDATE sponsors SET first_name = ?, last_name = ?, email = ?, phone = ?, dob = ?, address = ? WHERE sponsor_id = ?',
        [first_name, last_name, email, phone, dob, address, sponsorId]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Sponsor not found' });
      }
  
      res.json({ message: 'Profile updated successfully' });
      connection.end(); // Close the database connection
    } catch (error) {
      console.error('Error updating sponsor profile:', error);
      res.status(500).json({ message: 'Error updating sponsor profile' });
    }
  });



//sponsor panel(4.dashboard)
// Endpoint to fetch sponsor dashboard info (such as total contributions)
app.get('/sponsor/dashboard/:id', async (req, res) => {
    const sponsorId = req.params.id;
    
    try {
        // Query to get financial contributions by the sponsor
        const [financialContributions] = await db.execute('SELECT SUM(amount) AS total_contribution FROM financial_contributions WHERE sponsor_id = ?', [sponsorId]);

        res.json({
            totalFinancialContributions: financialContributions[0].total_contribution
        });
    } catch (error) {
        console.error('Error fetching sponsor dashboard:', error);
        res.status(500).json({ error: 'Database error' });
    }
});


// Serve Static Files for Admin, Sponsor, and Student
['admin', 'sponsor', 'student'].forEach(role => {
    const rolePath = `FABA-${role.charAt(0).toUpperCase() + role.slice(1)}`;
    app.use(`/${role}/assets`, express.static(path.join(__dirname, rolePath, 'assets')));
    app.use(`/${role}/sass`, express.static(path.join(__dirname, rolePath, 'sass')));
});

// Dynamic Page Routing for Admin, Sponsor, Student
['admin', 'sponsor', 'student'].forEach(role => {
    const rolePath = `FABA-${role.charAt(0).toUpperCase() + role.slice(1)}`;
    app.get(`/${role}/:page`, (req, res) => {
        const filePath = path.join(__dirname, rolePath, `${req.params.page}.html`);
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error(`Page not found: ${req.params.page}`);
                res.status(404).send('<h1>404 - Page Not Found</h1>');
            }
        });
    });
});

// Admin Route to View Book Requests
// Backend route to fetch book aid requests
app.get('/admin/Book-Aid-Request', (req, res) => {
    const query = 'SELECT * FROM faba_project.book_aid_requests';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).send('Database error');
        }
        console.log('DB Results:', results);  // Check if data is fetched
        res.json(results);
    });
});



// Approve a request
app.post('/admin/approve-request/:id', (req, res) => {
    const id = req.params.id;  // Retrieve the request ID from the URL parameter
    const query = 'UPDATE book_aid_requests SET status = "Approved" WHERE id = ?';

    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error approving request:', err);
            return res.status(500).send('Error approving request');
        }
        res.json({ message: 'Request approved' });  // Send success response
    });
});


// Reject a request
app.post('/admin/reject-request/:id', (req, res) => {
    const id = req.params.id;
    const query = 'UPDATE book_aid_requests SET status = "Rejected" WHERE id = ?';
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error rejecting request:', err);
            return res.status(500).send('Error rejecting request');
        }
        res.json({ message: 'Request rejected' }); // Send success response
    });
});


  
// Root Route
app.get('/', (req, res) => {
    res.send('<h1>Welcome to FABA</h1><p>Use /student, /admin, or /sponsor to navigate.</p>');
});

// 404 Handler for Undefined Routes
app.use((req, res) => {
    res.status(404).send('<h1>404 - Page Not Found</h1>');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
