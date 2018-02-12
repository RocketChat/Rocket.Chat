/* globals RocketChat */
import twilio from 'twilio';

class Twilio {
	constructor() {
		this.accountSid = RocketChat.settings.get('SMS_Twilio_Account_SID');
		this.authToken = RocketChat.settings.get('SMS_Twilio_authToken');
	}
	parse(data) {
		return {
			from: data.From,
			to: data.To,
			body: data.Body,

			extra: {
				toCountry: data.ToCountry,
				toState: data.ToState,
				toCity: data.ToCity,
				toZip: data.ToZip,
				fromCountry: data.FromCountry,
				fromState: data.FromState,
				fromCity: data.FromCity,
				fromZip: data.FromZip
			}
		};
	}
	send(fromNumber, toNumber, message) {
		const client = twilio(this.accountSid, this.authToken);

		client.messages.create({
			to: toNumber,
			from: fromNumber,
			body: message
		});
	}
	response(/* message */) {
		return {
			headers: {
				'Content-Type': 'text/xml'
			},
			body: '<Response></Response>'
		};
	}
	error(error) {
		let message = '';
		if (error.reason) {
			message = `<Message>${ error.reason }</Message>`;
		}
		return {
			headers: {
				'Content-Type': 'text/xml'
			},
			body: `<Response>${ message }</Response>`
		};
	}
}

RocketChat.SMS.registerService('twilio', Twilio);
