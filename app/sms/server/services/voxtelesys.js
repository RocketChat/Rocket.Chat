import { settings } from '/app/settings';
import { SMS } from '../SMS';
var http = require('request');

class Voxtelesys {
	constructor() {
		this.authToken = settings.get('SMS_Voxtelesys_authToken');
	}
	parse(data) {
		const returnData = {
			from: data.from,
			to: data.to,
			body: data.body,

			extra: {
				received_at: data.received_at,
			},
		};

		returnData.media = []; /* MMS not currently supported */

		return returnData;
	}
	send(fromNumber, toNumber, message) {
		var options = {
			timeout: 30000,
			followRedirect: false,
			url: 'https://servicelayer01.voxtelesys.net:3100/api/v1/sms',
			auth: {bearer: this.authToken},
			agentOptions: {ecdhCurve: 'auto'},
			forever: true,
			json: true,
			body: {
				to: [toNumber],
				from: fromNumber,
				body: message
			}
		};
		http.post(options, function(error, response, body) {
			if (error) {
				console.error(`Error connecting to Voxtelesys SMS API: ${ error }`);
			} else if (response.statusCode !== 200) {
				console.error(`Error from Voxtelesys SMS API: ${ response.statusCode } ${ JSON.stringify(body) }`);
			}
		});
	}
	response(/* message */) {
		return {
			headers: {
				'Content-Type': 'application/json',
			},
			body: {success: true},
		};
	}
	error(error) {
		let message = '';
		if (error.reason) {
			message = error.reason
		}
		return {
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				success: false,
				error: message
			},
		};
	}
}

SMS.registerService('voxtelesys', Voxtelesys);
