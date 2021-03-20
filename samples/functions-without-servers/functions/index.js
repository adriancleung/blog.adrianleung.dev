/**
 * sample/functions-without-servers/index.js
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
 * @fileoverview Sample file for Functions without Servers
 * @author Adrian Leung <contact@adrianleung.dev>
 *
 */

// Load the required modules for this application
const functions = require('firebase-functions');
const { google } = require('googleapis');

const gmail = google.gmail('v1');

// Firebase Functions HTTP endpoint to send mail through the Gmail API
exports.sendMail = functions.https.onRequest((request, response) => {
  if (request.method != 'POST') {
    response.sendStatus(500);
  } else {
    const { firstName, lastName, email, messageBody } = request.body;
    if (firstName && lastName && email && messageBody) {
      // Grab the client credentials and tokens stored in environment variables
      // and handles OAuth for Google APIs
      const {
        client_id,
        client_secret,
      } = functions.config().gmail.credentials.installed;
      const tokens = functions.config().gmail.tokens;
      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        'urn:ietf:wg:oauth:2.0:oob'
      );

      oAuth2Client.credentials = tokens;
      google.options({ auth: oAuth2Client });

      // Message content can be configured to your desire
      // Set the `From` and `To` addresses to your own email address
      // `Reply-To` is set to the person who submitted the form
      const subject = 'You\'ve received a message! ✉️';
      const utf8Subject = `=?utf8-8?B?${Buffer.from(subject).toString(
        'base64'
      )}?=`;
      const messageParts = [
        'From: REPLACE WITH NAME <REPLACE_WITH_OWN_ADDRESS@gmail.com>',
        'To: REPLACE WITH NAME <REPLACE_WITH_OWN_ADDRESS@gmail.com>',
        `Reply-To: ${firstName} ${lastName} <${email}>`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        messageBody,
      ];
      const message = messageParts.join('\n');

      // The message must be base64 encoded before sending
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Use the Gmail API to send the encoded message
      gmail.users.messages
        .send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage,
          },
        })
        .then(() => response.sendStatus(200))
        .catch(() => response.sendStatus(500));
    } else {
      response.sendStatus(400);
    }
  }
});
