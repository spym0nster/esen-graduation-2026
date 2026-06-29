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

async function fixSheets() {
  try {
    const res = await sheets.spreadsheets.get({spreadsheetId: sheetId});
    const existing = res.data.sheets.map(s => s.properties.title);
    const requests = [];

    const studentsSheet = res.data.sheets.find(s => s.properties.title.toLowerCase() === 'students');
    if (studentsSheet && studentsSheet.properties.title !== 'Students') {
      requests.push({
        updateSheetProperties: {
          properties: {
            sheetId: studentsSheet.properties.sheetId,
            title: 'Students'
          },
          fields: 'title'
        }
      });
    }

    if (!existing.some(t => t.toLowerCase() === 'guests')) {
      requests.push({
        addSheet: {
          properties: {
            title: 'Guests'
          }
        }
      });
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: { requests }
      });
      console.log('Sheets fixed!');
    } else {
      console.log('Sheets already correct.');
    }
  } catch(e) {
    console.error(e);
  }
}
fixSheets();
