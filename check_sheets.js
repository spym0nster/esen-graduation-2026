const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const sheetId = env.match(/GOOGLE_SHEET_ID=(.*)/)[1];
const email = env.match(/GOOGLE_SERVICE_ACCOUNT_EMAIL=(.*)/)[1];
const key = env.match(/GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="(.*)"/)[1].replace(/\\n/g, '\n');

const {google} = require('googleapis');
const auth = new google.auth.GoogleAuth({
  credentials: {client_email: email, private_key: key},
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets({version: 'v4', auth});

sheets.spreadsheets.get({spreadsheetId: sheetId}).then(res => {
  console.log('SHEETS:', res.data.sheets.map(s => s.properties.title));
}).catch(console.error);
