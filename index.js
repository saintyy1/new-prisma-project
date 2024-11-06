import { createServer } from 'http';
import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import userController from './UsersController.js';
import noteController from './NotesController.js';
import authController from './auth.js';
import transporter from './nodemailerService.js';

const PORT = process.env.PORT;
const ALLOWED_CORS_DOMAIN = process.env.ALLOWED_CORS_DOMAIN;

// Get current path
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const server = createServer(async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', `${ALLOWED_CORS_DOMAIN}:${PORT}`);  // Allow your frontend's origin
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');  // Allow specific methods
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');  // Allow specific headers
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // Handle POST Request (Create a new user)
    if (!req.url.includes("/api") && req.method === 'GET') {
        //fetch static contents
        let filePath = '.' + req.url;
        if (filePath === './') filePath = './index.html'; // Default to index.html

        const extname = path.extname(filePath);
        let contentType = 'text/html';

        // Set content type based on file extension
        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
                contentType = 'image/jpg';
                break;
            case '.svg':
                contentType = 'image/svg+xml';
                break; 
        }
        if(filePath == "./index.html"){
            filePath = path.join(__dirname, 'pages', 'public', 'index.html');
        }

        try {
            const data = await fs.readFile(filePath);

            res.setHeader('Content-Type', contentType);
            res.write(data);
            res.end();
        } catch {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'File not found' }));
        }
    }
    else if (req.url === '/api/users' && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {

                const userData = JSON.parse(body);

                // Check if the email already exists
                const existingUser = await userController.findUserByEmail(userData.email);
                if (existingUser) {
                    res.writeHead(409, { 'Content-Type': 'application/json' });  // Conflict status code
                    return res.end(JSON.stringify({ message: 'Email already exists.' }));
                }

                // Generate a 6-digit verification code
                let verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                userData.verificationCode = verificationCode;
                const newUser = await userController.createUserAsync(userData);

                let email = userData.email;
                let subject = 'Verify Your Email';
                let htmlContent = `
                    <p>You requested an Email Verification.</p>
                    <p>Click the link below to verify your email:</p>
                    <p>Your verification code is: ${verificationCode}</p>
                    <p>If you did not ask to verify your email, please ignore this email.</p>
                    <p>Thanks,</p>
                    <p>Your Idea app Team.</p>
                `;

                // Send the email
                transporter.sendMail(email, subject, htmlContent, true);

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'User created successfully. Redirecting to verify email.', newUser }));
            } catch (error) {
                console.log(error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Failed to create user.' }));
            }
        });
    }
    // Handle Email verification
    else if (req.url.match('/api/auth/verify-email') && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();  // Convert Buffer to string
        });

        req.on('end', async () => {
            try {
                const { verificationCode } = JSON.parse(body);

                if (!verificationCode) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Verification code is required' }));
                    return;
                }

                const user = await authController.verifyUserEmailAsync(verificationCode);  // Call the verification function

                if (!user) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Invalid verification code or user already verified' }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Email verified successfully' }));
            } catch (error) {
                console.error(error);  // Log the error
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Verification failed' }));
            }
        });
    }
    // verify unverified users
    else if (req.url.match('/api/auth/send-verification-code') && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();  // Convert Buffer to string
        });

        req.on('end', async () => {
            try {
                const { email } = JSON.parse(body);
                const user = await authController.sendVerificationCodeAsync(email);  // Call the verification function

                if (!user) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Invalid verification code or user already verified' }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Verification code sent. Redirecting...' }));
            } catch (error) {
                console.error(error);  // Log the error
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Verification failed' }));
            }
        });
    }
    //  Handle user LOGIN
    else if (req.url === '/api/auth/login' && req.method === 'POST') {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { email, password } = JSON.parse(body);
                const user = await authController.loginUserAsync(email, password);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Login successful', user }));
            } catch (error) {
                console.error(error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    //  Handle Forgot Password Request
    else if (req.url === '/api/auth/forgot-password' && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { email } = JSON.parse(body);
                const response = await authController.forgotPasswordAsync(email);  // Call your forgot password function

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
            } catch (error) {
                console.error(error);
                if (error.message === 'User with this email does not exist') {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'If this email is associated with an account, a password reset link will be sent.' }));
                    return;
                }
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    //  Handle Verify Password Token
    else if (req.url.match('/api/auth/verify-password') && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();  // Convert Buffer to string
        });

        req.on('end', async () => {
            try {
                const { email, token } = JSON.parse(body);

                if (!token) {  // Check for token instead of verificationCode
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Verification token is required' }));
                    return;
                }

                //  Call the verification function with email and token
                const user = await authController.verifyPasswordAsync(email, token);

                if (!user) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Invalid email or token' }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Reset Link verified successfully' }));
            } catch (error) {
                console.error('Verification error:', error);  // Log the error
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Verification failed' }));
            }
        });
    }

    //  Handle Reset Password for user
    else if (req.url.match('/api/auth/reset-password') && req.method === 'PUT') {
        let body = '';

        //  Collect the request body
        req.on('data', chunk => {
            body += chunk.toString();  // Convert Buffer to string
        });

        req.on('end', async () => {
            try {
                const { email, newPassword } = JSON.parse(body);

                const updatedUser = await authController.resetPasswordAsync(email, newPassword);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Password updated successfully', updatedUser }));
            } catch (error) {
                console.error('Error in reset password:', error);  // Log the error
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    //  Read operation for all users
    else if (req.url === '/api/users' && req.method === 'GET') {
        try {
            const users = await userController.getAllUserAsync();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(users));
        } catch (error) {
            console.log('got here', error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Failed to fetch users. error message: ${error.message}` }));
        }
    }
    //  Handle a User read
    else if (req.url.match(/^\/api\/users\/([0-9]+)$/) && req.method === 'GET') {
        const id = parseInt(req.url.split('/')[3]);

        try {
            const user = await userController.getUserAsync(id);
            if (!user) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: `User with ID ${id} not found` }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(user));
        } catch (error) {
            console.error(error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to find user' }));
        }
    }
    //  Handle Update operation for a user
    else if (req.url.match(/^\/api\/users\/([0-9]+)$/) && req.method === 'PUT') {
        const id = parseInt(req.url.split('/')[3]);

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const updatedData = JSON.parse(body);
                const updatedUser = await userController.updateUserAsync(id, updatedData);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(updatedUser));
            } catch (error) {
                console.error(error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to update user' }));
            }
        });
    }
    // Handle delete of user account
    else if (req.url.match(/\/api\/users\/([0-9]+)\/delete-account/) && req.method === 'PUT') {
        const id = parseInt(req.url.split('/')[3]);
    
        // Parse the request body to retrieve the status field
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
    
        req.on('end', async () => {
            const { status } = JSON.parse(body);
    
            try {
                // Update the user's status in the database
                const updatedUser = await userController.deleteUserAsync(id, status);
                if (!updatedUser) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'User not found' }));
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Account status updated successfully' }));
            } catch (error) {
                console.error(error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to update account status' }));
            }
        });
    }
    //  Handle user change password
    else if (req.url.match(/\/api\/users\/([0-9]+)\/change-password/) && req.method === 'PUT') {
        const id = parseInt(req.url.split('/')[3]);  // Extract userId from URL
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                //  Parse old and new passwords from the request body
                const { oldPassword, newPassword } = JSON.parse(body);

                //  Call the changePasswordAsync function to update the password
                const updatedUser = await userController.changePasswordAsync(id, oldPassword, newPassword);

                if (!updatedUser) {
                    //  Respond with failed message
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Change password failed' }));
                }
                //  Respond with success message
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Password updated successfully.'}));
            } catch (error) {
                console.error(error);
                //  Respond with error message
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to change password' }));
            }
        });
    }

    //  Create operation for a user note
    else if (req.url.match(/^\/api\/users\/([0-9]+)\/notes$/) && req.method === 'POST') {
        const userId = parseInt(req.url.split('/')[3], 10);

        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { userId, content } = JSON.parse(body);
                const newNote = await noteController.createNoteAsync(userId, content);
                console.log(newNote);

                if (!newNote) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'User does not exist' }));
                    return;
                }

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newNote));
            } catch (error) {
                console.error('Error creating note:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to create note', details: error.message }));
            }
        });
    }
    // Handle READ for all notes for a user
    else if (req.url.match(/^\/api\/users\/([0-9]+)\/notes$/) && req.method === 'GET') {
        const userId = parseInt(req.url.split('/')[3]);

        try {
            const note = await noteController.getNotesAsync(userId);

            if (!note) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Note not found for this user' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(note));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch note' }));
        }
    }
    //  Handle a single note read
    else if (req.url.match(/\/api\/users\/([0-9]+)\/notes\/([0-9]+)/) && req.method === 'GET') {
        const userId = parseInt(req.url.split('/')[3]);
        const noteId = parseInt(req.url.split('/')[5]);

        try {
            const note = await noteController.getNoteAsync(userId, noteId);

            if (!note) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Note not found for this user' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(note));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch note' }));
        }
    }
    //  Handle Update operation for note
    else if (req.url.match(/\/api\/users\/([0-9]+)\/notes\/([0-9]+)/) && req.method === 'PUT') {
        const userId = parseInt(req.url.split('/')[3]);
        const noteId = parseInt(req.url.split('/')[5]);

        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { content } = JSON.parse(body);
                const updatedNote = await noteController.updateNoteAsync(userId, noteId, content);

                if (!updatedNote) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Note not found for this user' }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(updatedNote));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to update the note' }));
            }
        });
    }
    //  Handle Delete operation for note
    else if (req.url.match(/\/api\/users\/([0-9]+)\/notes\/([0-9]+)/) && req.method === 'DELETE') {
        const userId = parseInt(req.url.split('/')[3]);
        const noteId = parseInt(req.url.split('/')[5]);

        try {
            const deletedNote = await noteController.deleteNoteAsync(userId, noteId);

            if (!deletedNote) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Note not found or does not belong to the user' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: `Note with ID ${noteId} deleted` }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to delete the note' }));
        }
    }
    // Handle invalid routes
    else {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(404);
        res.end(JSON.stringify({ message: 'Route not found' }));
    }
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
