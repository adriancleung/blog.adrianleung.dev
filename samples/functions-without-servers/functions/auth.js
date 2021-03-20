/**
 * sample/functions-without-servers/auth.js
 *
 * @license
 * Copyright (c) 2021 Adrian Leung
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
 * @fileoverview Helper function to authenticate through OAuth for Google APIs
 * @author Adrian Leung <contact@adrianleung.dev>
 *
 */

// Loads the required modules for this application
const { google } = require('googleapis');
const readline = require('readline');
const { promisify } = require('util');

readline.Interface.prototype.question[promisify.custom] = function (prompt) {
  return new Promise(resolve =>
    readline.Interface.prototype.question.call(this, prompt, resolve)
  );
};
readline.Interface.prototype.questionAsync = promisify(
  readline.Interface.prototype.question
);
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Configure the api scopes allowed for the application
// Lists of scopes found here:
// https://developers.google.com/identity/protocols/oauth2/scopes
const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Handles OAuth2 authentication flow to retrieve the access token before
// providing instructions on how to set credentials and tokens in Firebase
// Functions' environment variables
rl.questionAsync('Enter the JSON client secret content here: ').then(
  content => {
    const credentials = JSON.parse(content);
    // Firebase cannot store arrays in environment variables so deleting
    // unnecessary key-value pair (redirect_uris) from credentials object
    delete credentials.installed.redirect_uris;
    const oAuth2Client = new google.auth.OAuth2(
      credentials.installed.client_id,
      credentials.installed.client_secret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GMAIL_SCOPES.join(' '),
    });
    console.log('\nAuthorize this app by visiting this url:', authorizeUrl);
    rl.questionAsync('\nEnter the code from that page here: ').then(code => {
      rl.close();
      oAuth2Client.getToken(code).then(({ tokens }) => {
        // Firebase can only store strings in environment variables so
        // converting value (expiry_date) to string in tokens object
        tokens.expiry_date = tokens.expiry_date.toString();
        oAuth2Client.credentials = tokens;
        console.log(
          '\n\x1b[34mi\x1b[0m Enter the following two commands before deploying your functions:\n'
        );
        console.log(
          `❗️ firebase functions:config:set gmail.credentials='${JSON.stringify(
            credentials
          )}'\n`
        );
        console.log(
          `❗️ firebase functions:config:set gmail.tokens='${JSON.stringify(
            tokens
          )}'\n`
        );
      });
    });
  }
);
