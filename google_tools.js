var fs = require('fs');
const { google } = require('googleapis');
var open = require('open');

module.exports = {
  /**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} details the details for Google services
 * @param {Object} google_oauth the authorization object for google
 */
  authorize: function (details, google_oauth) {
    // const {client_secret, client_id, redirect_uris} = credentials.installed;
    // google_oauth = new google.auth.OAuth2(
    //     client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(details.token_path, (err, token) => {
      if (err) return this.getAccessToken(google_oauth, details);
      google_oauth.setCredentials(JSON.parse(token));
      console.log('Google services connected successfully');
    });
  },
  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   * @param {google.auth.OAuth2} google_oauth The OAuth2 client to get token for.
   * @param {Object} details info about where files are stored
   */
  getAccessToken: function (google_oauth, details) {
    const authUrl = google_oauth.generateAuthUrl({
      access_type: 'offline',
      scope: details.scopes,
    });
    open(authUrl, function (err) {
      if (err) console.log(err);
    });
  },
  /**
   * 
   * @param {Object} google_oauth OAuth2 client to save token for
   * @param {String} code the response code from Google web callback
   */
  saveAccessToken: function (google_oauth, code) {
    google_oauth.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      google_oauth.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile('google_token.json', JSON.stringify(token), (err) => {
        if (err) return err;
        console.log('Token stored to', 'google_token.json');
      });
      console.log('Google services connected successfully');
      return 'Google services connected successfully';
    });
  },
  /**
   * Lists the next 10 events on the user's primary calendar.
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  getGCalEvents: function (auth, numEvents) {
    const calendar = google.calendar({ version: 'v3', auth });
    //var eventData = [];
    return new Promise(function (resolve, reject) {
      calendar.events.list({
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        maxResults: numEvents,
        singleEvents: true,
        orderBy: 'startTime',
      }, (err, res) => {
        if (err)
          reject('The API returned an error: ' + err);
        const events = res.data.items;
        if (events.length)
          resolve(events);
        else {
          reject('No upcoming events found.');
          console.log('No upcoming events found.');
        }
      });
    });
  },
  /**
   * Lists the labels in the user's account.
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  getGmailLabels: function (auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    gmail.users.labels.list({
      userId: 'me',
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const labels = res.data.labels;
      if (labels.length) {
        console.log('Labels:');
        labels.forEach((label) => {
          console.log(`- ${label.name}`);
        });
      } else {
        console.log('No labels found.');
      }
    });
  }

};