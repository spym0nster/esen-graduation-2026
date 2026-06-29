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

async function clearSheets() {
  const res = await sheets.spreadsheets.get({spreadsheetId: sheetId});
  const studentsSheet = res.data.sheets.find(s => s.properties.title === 'Students').properties.sheetId;
  const guestsSheet = res.data.sheets.find(s => s.properties.title === 'Guests').properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [
        { updateCells: { range: { sheetId: studentsSheet }, fields: 'userEnteredValue' } },
        { updateCells: { range: { sheetId: guestsSheet }, fields: 'userEnteredValue' } }
      ]
    }
  });
  console.log("Cleared both sheets");
}
clearSheets().catch(console.error);
