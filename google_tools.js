/**
 * @fileoverview Collection of functions that deal with connecting to Google services
 * @author Donald Elrod
 * @version 1.0.0
 */
var fs = require('fs');
var file_tools = require('./file_tools.js');
const { google } = require('googleapis');
var open = require('open');
/**
 * Collection of functions that deal with connecting to Google services
 * @exports google_tools
 */
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
	 * This function is called when Google is communicating back to Home-Assistant after the user logs in.
	 * Saves the access token to google_token.json and sets the token as active Google credentials
	 * @param {Object} google_oauth OAuth2 client to save token for
	 * @param {String} code the response code from Google web callback
	 */
	saveAccessToken: function (google_oauth, code) {
		google_oauth.getToken(code, (err, token) => {
			if (err) return console.error('Error retrieving access token', err);
			google_oauth.setCredentials(token);
			// Store the token to disk for later program executions
			fs.writeFile('./config/google_token.json', JSON.stringify(token), (err) => {
				if (err) return err;
				console.log('Token stored to', 'google_token.json');
			});
			console.log('Google services connected successfully');
			return 'Google services connected successfully';
		});
	},
	/**
	 * This kicks off the Google authentication function chain, to be called in ProcessModules function
	 * @param {Object} modules the modules object from server.js, contains all objects/details for modules to work properly
	 * @param {Object} type the Netgear object loaded from the modules.json file (this is obtained during the initial forEach loop in the processModules function in server.js)
	 */
	processGoogleAccount: function(modules, type) {
		file_tools.readJSONFile(type.details.credentials).then( (content) => {
			const {client_secret, client_id, redirect_uris} = content.installed;
			modules.google = {};
			modules.google.google_oauth = new google.auth.OAuth2(
					client_id, client_secret, redirect_uris[0]);
			
			this.authorize(type.details, modules.google.google_oauth);
		});
	},
	/**
	 * Lists the next 10 events on the user's primary calendar.
	 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
	 * @param {Number} numEvents the max number of events to retrieve from the calendar
	 * @returns {Promise<Object[]>} a list of events from the user's Google Calendar
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
				if (err || res === undefined) {
					reject('The API returned an error: ' + err);
					return;
				}
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
			if (err) return console.log('The Gmail API returned an error: ' + err);
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
	},
	/**
	 * Get the recent email from your Gmail account
	 * Doesn't really work rn
	 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
	 */
	getRecentEmails: async function (auth) {
		return new Promise( (resolve, reject) => {
			const gmail = google.gmail({ version: 'v1', auth });
			var emails = [];
			// gets the most recent 20 emails (only their id though)
			gmail.users.messages.list({auth: auth, userId: 'me', maxResults: 2,}, function(err, response) {
				if (err) {
					console.log('The Gmail API returned an error: ' + err);
					return;
				}
		
				// Get the message id which we will need to retreive tha actual message next.
				var messages = response['data']['messages'];

				messages.forEach( (message) => {
					gmail.users.messages.get({auth: auth, userId: 'me', 'id': message.id, format: 'full'}, function(err, response) {
						if (err) {
							console.log('The API returned an error: ' + err);
							return;
						}

						var emailHTML = "";
						
						if (response.data.payload.parts) {
							response.data.payload.parts.forEach( (part) => {
								if (!part.body.data) return;
								var buff = Buffer.alloc(part.body.data.length, part.body.data, 'base64');
								emailHTML += buff.toString();
							});
							resolve(emailHTML);
							emails.push(emailHTML);
						}
					});
				});
			
				// Retreive the actual message using the message id
				// gmail.users.messages.get({auth: auth, userId: 'me', 'id': message_id}, function(err, response) {
				// 	if (err) {
				// 		console.log('The API returned an error: ' + err);
				// 		return;
				// 	}
			
				// 	console.log(response['data']);
				// });
			});
			return emails;
		});
		
	}

};