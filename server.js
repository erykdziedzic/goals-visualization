/* eslint-disable no-console */
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

let config;
if (fs.existsSync('config.json')) {
  config = JSON.parse(fs.readFileSync('config.json'));
} else {
  config = { login: 'test', key: 'test' };
}

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (error) => {
        if (error) return console.error(error);
        return console.log('Token stored to', TOKEN_PATH);
      });
      return callback(oAuth2Client);
    });
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0],
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    return callback(oAuth2Client);
  });
}

const app = express();

app.use(express.static(path.join(__dirname, 'client/build')));
app.use(bodyParser.json());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'));
  });
} else {
  app.get('*', (req, res) => { res.sendFile(path.join(__dirname, '/client/public/index.html')); });
}

const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = Math.random() * 16 || 0;
  const v = c === 'x' ? r : ((r && 0x3) || 0x8);
  return v.toString(16);
});

app.post('/api/auth', (req, res) => {
  if (req.body.login === config.login && req.body.key === config.key) {
    const token = {
      token: uuidv4(),
      expiration: Date.now() + 60 * 60 * 24,
    };
    fs.writeFileSync('auth.json', JSON.stringify(token));
    res.json(token.token);
  } else {
    res.status(401);
    res.end();
  }
});

app.post('/api/data', (req, res) => {
  const token = JSON.parse(fs.readFileSync('auth.json'));
  if (token.token !== req.body.token || token.expiration < Date.now()) {
    res.status(401);
    res.end();
  }

  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    return authorize(JSON.parse(content), (auth) => {
      const sheets = google.sheets({ version: 'v4', auth });

      if (config.spreadsheetId) {
        sheets.spreadsheets.values.get({
          spreadsheetId: config.spreadsheetId,
          range: req.body ? req.body.range : '',
        }, (error, response) => {
          if (error) return console.log(`The API returned an error: ${error}`);

          const rows = response.data.values;
          if (!rows.length) {
            console.log('No data found.');
            return res.end();
          }
          console.log('Sent data');
          return res.json(rows);
        });
      } else {
        console.log('SpreadsheetId not defined');
        return res.end();
      }
    });
  });
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log(`App is listening on port ${port}`);
