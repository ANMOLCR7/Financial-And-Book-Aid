const express = require('express');
const mysql = require('mysql2/promise');  // Use promise-based mysql
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 3000;
const session = require('express-session');
const multer = require('multer');
require("dotenv").config();

const storage = multer.diskStorage({
    destination: path.join(__dirname, 'FABA-Sponsor/uploads'),
    filename: (req, file, cb) => {
        if (!req.session || !req.session.sponsor) {
            return cb(new Error('Unauthorized'));
        }
        const sponsorId = req.session.sponsor.sponsor_id;
        cb(null, `sponsor_${sponsorId}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const mimeType = allowedTypes.test(file.mimetype);
        const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimeType && extName) {
            cb(null, true);
        } else {
            cb(new Error('Only .png, .jpg and .jpeg formats allowed!'));
        }
    }
});

// Set up session middleware
app.use(session({
    secret: 'your-secret-key',  // This can be any random string, used to sign the session cookie
    resave: false,              // Do not save session if it was not modified
    saveUninitialized: true,    // Save uninitialized sessions (if new)
    cookie: { secure: false }   // If using HTTPS, set secure: true
}));


// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Database Connection
const db = mysql.createPool({
    host: '127.0.0.1',
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
//(1.financial apply)
// Handle Financial Aid Form Submission
app.post('/submit-financial-aid', async (req, res) => {
    console.log('Received Data:', req.body); // Log the received data for debugging

    try {
        const {
            firstName, lastName, phoneNumber, emailAddress, aidAmount, address,
            studentId, prnNo, // Ensure these fields exist in your database
            username, accountEmail, bankAccountNumber, ifscCode, universityName, 
            courseName, currentYearSelect, boardName, jrFyPercentage, jrSyPercentage,
            semester1, semester2, semester3, semester4
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !emailAddress || !bankAccountNumber || !ifscCode || !prnNo) {
            return res.status(400).send('Missing required fields: first name, last name, email, bank account number, IFSC code, and Prn No are required.');
        }

        // SQL Query to insert data
        const query = `
            INSERT INTO financial_aid_requests 
            (first_name, last_name, phone, email, amount_requested, address, student_id, prn_no, username, account_email, 
            bank_account_no, ifsc_code, university, course, year, board, jr_fy, jr_sy, sem1, sem2, sem3, sem4)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
        `;

        // Ensure all fields are valid (e.g., numbers should be passed for percentage and amount)
        const values = [
            firstName, lastName, phoneNumber, emailAddress, 
            parseFloat(aidAmount) || null, // Ensure it's a number or null
            address, studentId, prnNo, username, accountEmail, bankAccountNumber, ifscCode, universityName, 
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

//(2. book donation Apply)
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

//(3. book donation view)
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

//(4.check student process)
app.get('/api/students/requests/financial-aid', async (req, res) => {
    try {
        const [results] = await db.execute('SELECT * FROM financial_aid_requests');
        res.json(results);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

 //Admin Panel  
//(1.Admin dashboard)
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

// API endpoint to fetch the number of sponsors per month
app.get('/api/sponsors', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                MIN(DATE_FORMAT(created_at, '%Y-%m-%d')) AS date,  -- Pick earliest date in the month
                MONTH(created_at) AS month,
                MONTHNAME(created_at) AS month_name,
                COUNT(*) AS sponsor_count
            FROM sponsors
            WHERE status = 'Active'
            GROUP BY MONTH(created_at), MONTHNAME(created_at)
            ORDER BY MONTH(created_at)
        `);
        
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

  // API to fetch book donations grouped by month
  app.get('/api/monthly-book-donations', async (req, res) => {
    try {
      // The updated SQL query to count donations per month
      const query = `
        SELECT
          DATE_FORMAT(donation_date, '%b %Y') AS month,
          COUNT(*) AS donations
        FROM book_donations
        GROUP BY DATE_FORMAT(donation_date, '%b %Y')
        ORDER BY MIN(donation_date);
      `;
      
      const [rows] = await db.query(query);
  
      // Format the response to match the desired structure
      const response = {
        success: true,
        donations: rows
      };
  
      res.json(response);
    } catch (error) {
      console.error('Error fetching book donations:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
// API endpoint to fetch pending financial aid requests data by date and month
app.get('/api/pending-financial-aid', async (req, res) => {
    const query = `
        SELECT 
            DATE_FORMAT(submission_date, '%Y-%m-%d') AS date, 
            MONTH(submission_date) AS month,
            COUNT(*) AS pending_count
        FROM 
            financial_aid_requests
        WHERE 
            status = 'Pending'
        GROUP BY 
            submission_date -- ✅ Group by submission_date to avoid conflict
        ORDER BY 
            submission_date
    `;
  
    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint to get all financial aid requests
app.get('/api/financial-aid-requests', async (req, res) => {
    try {
        const [results] = await db.execute(`
            SELECT * 
            FROM financial_aid_requests 
            WHERE status = 'Pending'
            ORDER BY submission_date DESC;  -- Ensures recent requests are listed first
        `);
        res.json(results);
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ error: 'Database error' });
    }
});


//(2. finncial aid request)
// Get all admin financial aid requests
app.get('/api/student-financial-aid/requests', async (req, res) => {
    try {
        const query = `
            SELECT request_id, student_id, first_name, last_name, amount_requested, 
                   prn_no, bank_account_no, ifsc_code, university, course, year, board, status, submission_date, review_date 
            FROM financial_aid_requests;
        `;
        const [rows] = await db.execute(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching financial aid requests:', error);
        res.status(500).json({ message: 'Error fetching financial aid requests' });
    }
});

//admin review
app.post('/api/financial-aid-requests/review/:requestId', async (req, res) => {
    const { requestId } = req.params;
    try {
        const query = `
            UPDATE financial_aid_requests 
            SET review_date = NOW() 
            WHERE request_id = ?`;
        const [result] = await db.execute(query, [requestId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({ message: 'Review date updated successfully' });
    } catch (error) {
        console.error('Error updating review date:', error);
        res.status(500).json({ error: 'Database error' });
    }
});


// Get specific financial aid request details by ID
app.get('/admin/get-request-details/:requestId', async (req, res) => {
    const { requestId } = req.params;

    try {
        const query = 'SELECT * FROM financial_aid_requests WHERE request_id = ?';
        const [rows] = await db.execute(query, [requestId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.json(rows[0]); // Return the first matching row
    } catch (error) {
        console.error('Error fetching request details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//(3.book donated)
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
 
//(4. Manage sponsors)
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

//(5.Admin review the sponsors contribution)
// API Route to Fetch Contributions
app.get("/api/contributions", async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT 
                contribution_id, 
                request_id, 
                student_id, 
                prn_no, 
                student_name, 
                sponsor_id, 
                sponsor_name, 
                contribution_amount, 
                contribution_date 
            FROM financial_contributions
            ORDER BY contribution_date DESC;
        `);
        res.json(results); // Directly send array
    } catch (error) {
        console.error("Error fetching contributions:", error);
        res.status(500).json({ error: "Database error" });
    }
});


//-----Sponsor API Endpoints-----
//sponsors loogin
async function generateHash() {
    const password = '1111';
    const saltRounds = 10;  // Number of rounds for bcrypt
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Generated Hash for 1111:', hashedPassword);
}

generateHash();


require("dotenv").config();

app.post('/sponsor/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Received username:', username);
    console.log('Received password:', password);
    console.log('Received password length:', password.length);

    try {
        // Query the database to get sponsor information
        const [rows] = await db.query('SELECT * FROM sponsors WHERE LOWER(email) = LOWER(?)', [username]);
        console.log('Query result:', rows);
        
        // Check if user exists
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username' });
        }

        const sponsor = rows[0];

        // Compare the input password with the stored hashed password
        const match = await bcrypt.compare(password.trim(), sponsor.password.trim());

        if (!match) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Store sponsor details in session
        req.session.sponsor = sponsor;

        // Redirect to the dashboard (sending redirect URL via JSON)
        res.status(200).json({ redirectUrl: '/sponsor/Sponsor-dashboard' });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ✅ Sponsor Sign Up Route
app.post('/sponsor/signup', async (req, res) => {
    const { first_name, last_name, email, password, phone } = req.body;

    if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({ message: "All required fields must be filled." });
    }

    try {
        // ✅ Check if sponsor already exists
        const [existingSponsor] = await db.query("SELECT email FROM sponsors WHERE email = ?", [email]);

        if (existingSponsor.length > 0) {
            return res.status(400).json({ message: "Email already registered. Try logging in." });
        }

        // ✅ Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Insert into Database
        await db.query(
            `INSERT INTO sponsors (first_name, last_name, email, phone, password, status) 
             VALUES (?, ?, ?, ?, ?, 'Active')`,
            [first_name, last_name, email, phone || 'Not Provided', hashedPassword]
        );

        res.status(201).json({ message: "Registration successful! Redirecting..." });

    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});

// Forgot Password Route
app.post('/sponsor/forgot-password', async (req, res) => {
    const { email, sponsor_id } = req.body;

    if (!email || !sponsor_id) {
        return res.status(400).json({ message: "Missing email or sponsor ID." });
    }

    try {
        const [rows] = await db.query("SELECT * FROM sponsors WHERE email = ? AND sponsor_id = ?", [email, sponsor_id]);

        if (rows.length === 0) {
            return res.status(400).json({ message: "Invalid email or sponsor ID." });
        }

        res.status(200).json({ redirect: `/sponsor/reset-password?sponsor_id=${sponsor_id}` });
    } catch (error) {
        console.error("Forgot Password error:", error);
        res.status(500).json({ message: "Server error. Try again later." });
    }
});

//Email verification
app.post('/sponsor/validate-email', async (req, res) => {
    const { email } = req.body;

    console.log("Email received:", email); // ✅ Check if email is being received

    if (!email) {
        return res.status(400).json({ message: "Please enter your email." });
    }

    try {
        // ✅ Check if email exists in DB
        const [rows] = await db.query("SELECT sponsor_id FROM sponsors WHERE email = ?", [email]);

        console.log("DB result:", rows); // ✅ Log DB result

        if (rows.length === 0) {
            return res.status(404).json({ message: "Email not found. Please check and try again." });
        }

        res.status(200).json({ message: "Email is valid." });
    } catch (error) {
        console.error("Email validation error:", error); // ✅ Log any errors
        res.status(500).json({ message: "Server error. Try again later." });
    }
});

//Reset Password
app.post('/sponsor/reset-password', async (req, res) => {
    const { sponsor_id, newPassword } = req.body;

    if (!sponsor_id || !newPassword) {
        return res.status(400).json({ message: "Missing sponsor ID or password." });
    }

    try {
        // ✅ Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // ✅ Update the password in the database
        const [result] = await db.query(
            "UPDATE sponsors SET password = ? WHERE sponsor_id = ?",
            [hashedPassword, sponsor_id]
        );

        // ✅ Check if update was successful
        if (result.affectedRows === 0) {
            return res.status(400).json({ message: "Invalid sponsor ID." });
        }

        res.status(200).json({ message: "Password has been reset successfully!" });

    } catch (error) {
        console.error("Reset Password error:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});

//Sponsor panel(1.dashboard)
//dashboard sponsors details
app.get('/sponsor/dashboard', (req, res) => {
    if (!req.session.sponsor) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const sponsor = req.session.sponsor;
    res.status(200).json({ sponsor: sponsor });
});

//total request sponsors dashboard
app.get('/api/financial-aid-requests-by-year', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                year,
                COUNT(*) AS total_requests
            FROM 
                faba_project.financial_aid_requests
            GROUP BY 
                year
        `);

        res.json(rows);  // Sending the result back to the frontend
    } catch (error) {
        console.error('Error fetching financial aid requests:', error);
        res.status(500).send('Internal Server Error');
    }
});

// API to fetch aid statistics sponsors dashboard
// Assuming you have express-session middleware set up
app.get('/api/sponsor/aid-stats', async (req, res) => {
    if (!req.session || !req.session.sponsor) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
  
    const sponsorId = req.session.sponsor.sponsor_id;
  
    try {
      // Fetch total contributions and total contributed amount
      const queryTotal = `
        SELECT 
          COUNT(contribution_id) AS total_contributions,
          COALESCE(SUM(contribution_amount), 0) AS total_contributed
        FROM 
          financial_contributions
        WHERE 
          sponsor_id = ?
      `;
      const [totalResults] = await db.query(queryTotal, [sponsorId]);
  
      // Fetch monthly contribution data
      const queryMonthly = `
        SELECT 
          DATE_FORMAT(contribution_date, '%b %Y') AS month,
          COUNT(contribution_id) AS total_contributions,
          COALESCE(SUM(contribution_amount), 0) AS total_contributed
        FROM 
          financial_contributions
        WHERE 
          sponsor_id = ?
        GROUP BY 
          DATE_FORMAT(contribution_date, '%b %Y')
        ORDER BY 
          MIN(contribution_date)
      `;
      const [monthlyResults] = await db.query(queryMonthly, [sponsorId]);
  
      res.json({
        total_contributions: totalResults[0].total_contributions || 0,
        total_contributed: totalResults[0].total_contributed || 0.0,
        monthly_contributions: monthlyResults
      });
    } catch (error) {
      console.error('Error fetching aid statistics:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
//<Sponsors panel(2.View-Book-Requests)
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

app.get('/sponsor/get-session', (req, res) => {
    if (!req.session.sponsor) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    res.json({ sponsorId: req.session.sponsor.sponsor_id });
});


//Sponsors Making contribution
app.post('/sponsor/contribute/:requestId', async (req, res) => {
    const { requestId } = req.params;
    const { sponsorId, paymentAmount } = req.body;
    console.log('Sending:', { sponsorId, paymentAmount });

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
        if (error.sqlState === '45000' && error.sqlMessage.includes('Contribution exceeds requested amount')) {
            res.json({ error: 'Your payment exceeds the remaining amount. Please enter a valid amount.' });
        } else{
        console.error('Error recording contribution:', error);
        res.status(500).json({ error: 'Failed to record contribution' });
        }
    }
});


// Endpoint to fetch student bank details
app.get('/sponsor/get-student-bank-details/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const [results] = await db.execute('SELECT bank_account_no, ifsc_code, amount_requested, remaining_amount FROM financial_aid_requests WHERE student_id = ?', [studentId]);
        
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

//Sponsors panel(3.Contribute Financially)
// Endpoint to make a financial contribution
app.get('/sponsor/contributions', async (req, res) => {
    if (!req.session.sponsor) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const sponsorId = req.session.sponsor.sponsor_id;

    try {
        const query = `
            SELECT 
                fc.contribution_id,
                fc.request_id,
                fc.contribution_amount,
                fc.contribution_date,
                far.student_id,
                far.first_name,
                far.last_name
            FROM financial_contributions fc
            JOIN financial_aid_requests far ON fc.request_id = far.request_id
            WHERE fc.sponsor_id = ?
        `;
        
        const [rows] = await db.execute(query, [sponsorId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching sponsor contributions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//Sponsor panel(4.Profile)
app.get('/getSponsorData', async (req, res) => {
    if (!req.session.sponsor) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    const sponsorId = req.session.sponsor.sponsor_id;

    try {
        const [rows] = await db.execute(
            `SELECT sponsor_id, 
                    CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) AS full_name,
                    first_name,
                    last_name,
                    email,
                    phone,
                    DATE_FORMAT(dob, '%Y-%m-%d') AS dob,
                    address,
                    profile_picture,
                    contribution_amount,
                    status,
                    DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at,
                    DATE_FORMAT(last_updated_at, '%Y-%m-%d') AS last_updated_at
             FROM sponsors 
             WHERE sponsor_id = ?`,
            [sponsorId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Sponsor not found' });
        }

        // ✅ Fix profile picture path
        const profilePicture = rows[0].profile_picture || '/uploads/default-avatar.png';

        res.json({
            full_name: rows[0].full_name || 'Not provided',
            first_name: rows[0].first_name || '',
            last_name: rows[0].last_name || '',
            email: rows[0].email || 'Not provided',
            phone: rows[0].phone || 'Not provided',
            dob: rows[0].dob || null,
            address: rows[0].address || '',
            profile_picture: profilePicture,
            contribution_amount: rows[0].contribution_amount || '0.00',
            status: rows[0].status || 'Inactive',
            created_at: rows[0].created_at || 'N/A',
            last_updated_at: rows[0].last_updated_at || 'N/A'
        });
    } catch (error) {
        console.error('Error fetching sponsor data:', error);
        res.status(500).json({ message: 'Error fetching sponsor data' });
    }
});

// ✅ Update Profile (with profile picture)
app.patch('/updateSponsorProfile', upload.single('profile_picture'), async (req, res) => {
    if (!req.session.sponsor) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    const sponsorId = req.session.sponsor.sponsor_id;
    const { first_name, last_name, email, phone, dob, address } = req.body;
    
    // ✅ Handle Profile Picture Path
    const profilePicture = req.file 
        ? `/uploads/sponsor_${sponsorId}${path.extname(req.file.originalname)}` 
        : undefined;

    try {
        const query = `
            UPDATE sponsors 
            SET first_name = ?, last_name = ?, email = ?, phone = ?, dob = ?, address = ?
            ${profilePicture !== undefined ? ', profile_picture = ?' : ''}
            WHERE sponsor_id = ?
        `;

        const params = profilePicture !== undefined
            ? [first_name, last_name, email, phone, dob, address, profilePicture, sponsorId]
            : [first_name, last_name, email, phone, dob, address, sponsorId];

        await db.execute(query, params);

        res.json({ 
            success: true, 
            message: 'Profile updated successfully',
            filePath: profilePicture 
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

//Sponsor and Admin header
// Check for New Requests and Send Notification
  app.get('/api/new-requests', async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT CONCAT(first_name, ' ', last_name) AS student_name, amount_requested 
         FROM financial_aid_requests WHERE status = "Pending"`
      );
      res.json(rows);
    } catch (error) {
      console.error('Database error:', error);
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


// Root Route
app.get('/', (req, res) => {
    res.send('<h1>Welcome to FABA</h1><p>Use /student, /admin, or /sponsor to navigate.</p>');
});

app.use('/uploads', express.static(path.join(__dirname, 'FABA-Sponsor/uploads')));

// 404 Handler for Undefined Routes
app.use((req, res) => {
    res.status(404).send('<h1>404 - Page Not Found</h1>');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
