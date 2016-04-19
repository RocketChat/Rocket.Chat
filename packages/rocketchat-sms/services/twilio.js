/* globals RocketChat */
class Twilio {
	constructor() {
		this.accountSid = RocketChat.settings.get('SMS_Twilio_Account_SID');
		this.authToken = RocketChat.settings.get('SMS_Twilio_authToken');
		this.fromNumber = RocketChat.settings.get('SMS_Twilio_fromNumber');
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
	send(to, message) {
		var client = Npm.require('twilio')(this.accountSid, this.authToken);

		client.messages.create({
			to: to,
			from: this.fromNumber,
			body: message,
		});
	}
}

RocketChat.SMS.registerService('twilio', Twilio);
