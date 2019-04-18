import { HTTP } from 'meteor/http';

import { settings } from '../../../settings';

import { SMS } from '../SMS';

class Voxtelesys {
	constructor() {
		this.authToken = settings.get('SMS_Voxtelesys_authToken');
		this.URL = settings.get('SMS_Voxtelesys_URL');
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
		const options = {
			timeout: 30000,
			followRedirects: false,
			headers: {
				Authorization: `Bearer ${ this.authToken }`,
			},
			data: {
				to: [toNumber],
				from: fromNumber,
				body: message,
			},
			npmRequestOptions: {
				agentOptions: {
					ecdhCurve: 'auto',
				},
				forever: true,
			},
		};

		try {
			HTTP.call('POST', this.URL || 'https://smsapi.voxtelesys.net/api/v1/sms', options);
		} catch (error) {
			console.error(`Error connecting to Voxtelesys SMS API: ${ error }`);
		}
	}
	response(/* message */) {
		return {
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				success: true,
			},
		};
	}
	error(error) {
		let message = '';
		if (error.reason) {
			message = error.reason;
		}
		return {
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				success: false,
				error: message,
			},
		};
	}
}

SMS.registerService('voxtelesys', Voxtelesys);
