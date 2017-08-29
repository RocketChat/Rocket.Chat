/* globals RocketChat */
class Twilio {
	constructor() {
		this.accountSid = RocketChat.settings.get('SMS_Twilio_Account_SID');
		this.authToken = RocketChat.settings.get('SMS_Twilio_authToken');
	}
	parse(data) {
		var NumMedia = 0;
		
		var returndata = {
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

		if(data.NumMedia) {
			NumMedia = parseInt(data.NumMedia, 10);
		}

		if (isNaN(NumMedia)) {
			console.error("Error parsing NumMedia " + data.NumMedia);
			return returndata;
		}

		returndata.hasMedia = true;
		returndata.media = [];

		for(var mediaIndex = 0; mediaIndex < NumMedia; mediaIndex++) {
			var mediaurl = data["MediaUrl" + mediaIndex];
			var contenttype = data["MediaContentType" + mediaIndex];

			returndata.media.push({
				"url": mediaurl,
				"contenttype": contenttype
			});
		}
		
		return returndata;
	}
	send(fromNumber, toNumber, message) {
		const client = Npm.require('twilio')(this.accountSid, this.authToken);

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
