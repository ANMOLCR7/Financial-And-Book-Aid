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

    // Handle Book Aid Form Submission
    app.post('/submit-book-request', async (req, res) => {
        console.log('Received Book Request Data:', req.body); // Log the received data
    
        try {
            const {
                studentId, firstName, lastName, phoneNumber, emailAddress, bookTitle, address
            } = req.body;
    
            // Validate required fields
            if (!studentId || !firstName || !lastName || !phoneNumber || !emailAddress || !bookTitle || !address) {
                return res.status(400).send('Missing required fields: student ID, first name, last name, phone number, email, book title, and address are required.');
            }
    
            // SQL Query to insert book request
            const query = `
                INSERT INTO book_aid_requests (student_id, first_name, last_name, phone_number, email_address, book_title, address)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
                studentId, firstName, lastName, phoneNumber, emailAddress, bookTitle, address
            ];
    
            // Execute Query using promise-based mysql2
            const [result] = await db.execute(query, values);
    
            console.log('Book request submitted successfully:', result);
            res.status(200).send('Book request submitted successfully');
        } catch (error) {
            console.error('Error processing book request:', error); // Log the error
            res.status(500).send('Internal Server Error');
        }
    });
    

    // Endpoint to handle book donations
    app.post('/submit-book-donation', async (req, res) => {
        console.log('Received Donation Data:', req.body); // Log the received data
    
        try {
            const {
                studentName, phoneNumber, emailAddress, bookTitle, address
            } = req.body;
    
            // Validate required fields
            if (!studentName || !phoneNumber || !emailAddress || !bookTitle || !address) {
                return res.status(400).send('Missing required fields: student name, phone number, email, book title, and address are required.');
            }
    
            // SQL Query to insert book donation
            const query = `
                INSERT INTO book_donations (student_name, phone_number, email_address, book_title, address)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const values = [
                studentName, phoneNumber, emailAddress, bookTitle, address
            ];
    
            // Execute Query using promise-based mysql2
            const [result] = await db.execute(query, values);
    
            console.log('Donation submitted successfully:', result);
            res.status(200).send('Donation submitted successfully');
        } catch (error) {
            console.error('Error processing donation:', error); // Log the error
            res.status(500).send('Internal Server Error');
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

// Endpoint to approve a financial aid request
app.post('/api/approve-request/:id', async (req, res) => {
    const requestId = req.params.id;
    try {
        await db.execute('UPDATE financial_aid_requests SET status = "Approved" WHERE request_id = ?', [requestId]);
        res.status(200).json({ message: 'Request approved' });
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({ error: 'Failed to approve request' });
    }
});

// Endpoint to reject a financial aid request
app.post('/api/reject-request/:id', async (req, res) => {
    const requestId = req.params.id;
    try {
        await db.execute('UPDATE financial_aid_requests SET status = "Rejected" WHERE request_id = ?', [requestId]);
        res.status(200).json({ message: 'Request rejected' });
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({ error: 'Failed to reject request' });
    }
});

// Endpoint to fetch all book aid requests for admin
app.get('/admin/book-aid-requests', async (req, res) => {
    try {
        const [results] = await db.execute('SELECT * FROM book_aid_requests');
        res.json(results);  // Send the data as JSON
    } catch (error) {
        console.error('Error fetching book aid requests:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Approve a book aid request
app.post('/admin/approve-request/:id', async (req, res) => {
    const requestId = req.params.id;
    try {
        await db.execute('UPDATE book_aid_requests SET status = "Approved" WHERE student_id = ?', [requestId]);
        res.status(200).json({ message: 'Request approved' });
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({ error: 'Failed to approve request' });
    }
});

// Reject a book aid request
app.post('/admin/reject-request/:id', async (req, res) => {
    const requestId = req.params.id;
    try {
        await db.execute('UPDATE book_aid_requests SET status = "Rejected" WHERE student_id = ?', [requestId]);
        res.status(200).json({ message: 'Request rejected' });
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({ error: 'Failed to reject request' });
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

// Endpoint to fetch all admin manage students
// API endpoint to fetch students
app.get('/api/getStudents', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM students');
      res.json({ data: rows });
    } catch (err) {
      console.error('Error fetching students:', err);
      res.status(500).send({ error: 'Error fetching students' });
    }
  });




//-----Sponsor API Endpoints-----
//<Sponsors panel(1.View-Book-Requests)
// Endpoint to fetch all financial aid requests for sponsors
app.get('/sponsor/financial-aid-requests', async (req, res) => {
    try {
        const [results] = await db.execute('SELECT * FROM financial_aid_requests WHERE status = "Approved"');
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
            'UPDATE financial_aid_requests SET payment_status = "Approved" WHERE request_id = ?',
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


// Reject a financial aid request
app.post('/sponsor/reject-request/:requestId', async (req, res) => {
    const { requestId } = req.params;
    try {
        await db.execute('UPDATE financial_aid_requests SET status = "Rejected" WHERE request_id = ?', [requestId]);
        res.json({ message: 'Request rejected successfully' });
    } catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).json({ error: 'Failed to reject request' });
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
