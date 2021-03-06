/**
 * sample/docker-the-world/app.js
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
 * @fileoverview Sample file for Docker the World
 * @author Adrian Leung <contact@adrianleung.dev>
 * 
 */

'use-strict';

// Loads the required modules for this application
const express = require('express');

// Creates an Express application
const app = express();

// Returns `Hello World!` if GET from / endpoint
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Tells the Express application to listen on a given port
// Use port 3000 if port environment variable is not set
const listener = app.listen((typeof process.env.PORT === 'undefined') ? 3000 : process.env.PORT, () => {
    console.log('Your app is listening on port ', listener.address().port);
});