/**
 * sample/ending-contact-forms-with-gmail-api/app.js
 * 
 * Adapted from https://developers.google.com/gmail/api/quickstart/nodejs
 * 
 * @license
 * Copyright (c) 2020 Adrian Leung
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * @fileoverview Sample file for Sending Contact Forms with Gmail API
 * @author Adrian Leung <contact@adrianleung.dev>
 * 
 */

'use-strict';

// Loads the required modules for this application
const fs = require('fs');
const util = require('util');
const readline = require('readline');
const { google } = require('googleapis');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

// Creates an Express application
const app = express();

// Promisify the read and write file function
const readFileContent = util.promisify(fs.readFile);
const writeFileContent = util.promisify(fs.writeFile);

// Configure the api scopes allowed for the application
// Lists of scopes found here:
// https://developers.google.com/identity/protocols/oauth2/scopes
const SCOPES = [
    'https://www.googleapis.com/auth/gmail.send'
];

const TOKEN_PATH = 'token.json';
const CREDENTIALS_PATH = 'credentials.json';
const INTERNAL_SERVER_ERROR = 500;
const SUCCESS = 200;

var firstName;
var lastName;
var email;
var message;

// Configure CORS options
// Information about CORS:
// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
var corsOptions = {
    origin: 'REPLACE_WITH_YOUR_WEBSITE',
    methods: 'POST'
}

// Create two new files when deployed in Heroku's environment
if (process.env.NODE_ENV === 'production') {
    writeFileContent(CREDENTIALS_PATH, process.env.credentials_json)
        .then(console.log('Credentials stored to', CREDENTIALS_PATH))
        .catch(err => console.log(err));

    writeFileContent(TOKEN_PATH, process.env.token_json)
        .then(console.log('Token stored to', TOKEN_PATH))
        .catch(err => console.log(err));
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    return await readFileContent(TOKEN_PATH)
        .then(async buff => {
            oAuth2Client.setCredentials(JSON.parse(buff));
            return await callback(oAuth2Client);
        })
        .catch(async err => {
            return await getNewToken(oAuth2Client, callback);
        });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
async function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', async (code) => {
        rl.close();
        return await oAuth2Client.getToken(code, async (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            writeFileContent(TOKEN_PATH, JSON.stringify(token))
                .then(async () => {
                    console.log('Token stored to', TOKEN_PATH);
                    return await callback(oAuth2Client);
                })
                .catch(err => {
                    console.error(err);
                    return INTERNAL_SERVER_ERROR;
                });
        });
    });
}

/**
 * Sends an email using Gmail with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} auth The authorized OAuth2 client.
 * @return {Number} Status code of the API call
 */
async function sendMail(auth) {
    const from = 'From:  FIRSTNAME LASTNAME <EMAIL_ADDRESS@example.com>\n';
    const replyTo = 'Reply-To: ' + firstName + ' ' + lastName + ' <' + email + '>\n';
    const to = 'To: FIRSTNAME LASTNAME <EMAIL_ADDRESS@example.com>\n';
    const subject = 'Subject: Contact Form Submitted!\n\n';
    const body = firstName + ' ' + lastName + ' (' + email + ') sent you a message:\n\n' + message;
    const urlBase64Message = encode(from + replyTo + to + subject + body);

    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.send({
        requestBody: {
            raw: urlBase64Message,
        },
        userId: 'me',
    });

    if (res.status === SUCCESS && res.data.labelIds.includes('SENT')) {
        console.log('Email sent!');
        return SUCCESS;
    } else {
        console.error(res.status, 'ERROR: Email not sent!');
        return INTERNAL_SERVER_ERROR;
    }
}

/**
 * Encodes the string email message to url safe base64
 * @param {String} unencoded Unencoded string email message
 * @return {String} The encoded string email message in url safe base64
 */
function encode(unencoded) {
    const encoded = new Buffer.from(unencoded).toString('base64');
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

// Middleware used for logging
app.use(morgan('combined'));
// Middleware used to parse x-www-form-urlencoded request bodies
app.use(express.urlencoded({ extended: true }));

// Redirects users to your default site if GET from / endpoint
app.get('/', (req, res) => {
    res.redirect(301, 'REPLACE_WITH_YOUR_WEBSITE');
});

// Calls the authorization function before sending an email
// with the POST request body if POST to /send endpoint
app.post('/send', cors(corsOptions), (req, res) => {
    firstName = req.body.firstName;
    lastName = req.body.lastName;
    email = req.body.email;
    message = req.body.message;

    // Validation that all fields are entered
    // Validations should be done on client side but just in case
    if (!(firstName && lastName && email && message)) {
        console.error('Not all fields are defined in POST request');
        res.status(INTERNAL_SERVER_ERROR).send();
        return;
    }

    // Reads the credentials and calls the authorization function with the
    // sendMail callback function as a parameter
    readFileContent(CREDENTIALS_PATH)
        .then(async buff => {
            var statusCode = await authorize(JSON.parse(buff), sendMail);
            res.status(statusCode).send();
        })
        .catch(err => {
            console.error('Error loading client secret file: ', err);
            res.status(INTERNAL_SERVER_ERROR).send();
        });
});

// Tells the Express application to listen on a given port
// Use port 3000 if port environment variable is not set
const listener = app.listen((typeof process.env.PORT === 'undefined') ? 3000 : process.env.PORT, () => {
    console.log('Your app is listening on port ' + listener.address().port);
});