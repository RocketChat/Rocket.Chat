import { HTTP } from 'meteor/http';
import { Base64 } from 'meteor/base64';

import { settings } from '../../../settings';
import { SMS } from '../SMS';

class Mobex {
	constructor() {
		this.address = settings.get('SMS_Mobex_gateway_address');
		this.restAddress = settings.get('SMS_Mobex_restful_address');
		this.username = settings.get('SMS_Mobex_username');
		this.password = settings.get('SMS_Mobex_password');
		this.from = settings.get('SMS_Mobex_from_number');
	}

	parse(data) {
		let numMedia = 0;

		console.log('Mobex parse: ', data);

		const returnData = {
			from: data.from,
			to: data.to,
			body: data.content,

			// extra: {
			// 	toCountry: data.ToCountry,
			// 	toState: data.ToState,
			// 	toCity: data.ToCity,
			// 	toZip: data.ToZip,
			// 	fromCountry: data.FromCountry,
			// 	fromState: data.FromState,
			// 	fromCity: data.FromCity,
			// 	fromZip: data.FromZip,
			// },
		};

		if (data.NumMedia) {
			numMedia = parseInt(data.NumMedia, 10);
		}

		if (isNaN(numMedia)) {
			console.error(`Error parsing NumMedia ${ data.NumMedia }`);
			return returnData;
		}

		returnData.media = [];

		for (let mediaIndex = 0; mediaIndex < numMedia; mediaIndex++) {
			const media = {
				url: '',
				contentType: '',
			};

			const mediaUrl = data[`MediaUrl${ mediaIndex }`];
			const contentType = data[`MediaContentType${ mediaIndex }`];

			media.url = mediaUrl;
			media.contentType = contentType;

			returnData.media.push(media);
		}

		return returnData;
	}

	send(fromNumber, toNumber, message, username = null, password = null, address = null) {
		console.log('Mobex send fromNumber', fromNumber);
		console.log('Mobex send toNumber', toNumber);
		console.log('Mobex send message', message);
		console.log('Mobex send username', username);
		console.log('Mobex send address', address);
		console.log('Mobex send password', password);
		console.log('Mobex send from', this.from);

		let currentFrom = this.from;
		let currentUsername = this.username;
		let currentAddress = this.address;
		let currentPassword = this.password;

		if (fromNumber) {
			currentFrom = fromNumber;
		}
		if (username && password) {
			currentUsername = username;
			currentPassword = password;
		}
		if (address) {
			currentAddress = address;
		}

		console.log('Mobex send currentFrom', currentFrom);

		const strippedTo = toNumber.replace(/\D/g, '');
		const result = {
			isSuccess: false,
			resultMsg: 'An unknown error happened',
		};

		try {
			const response = HTTP.call('GET', `${ currentAddress }/send?username=${ currentUsername }&password=${ currentPassword }&to=${ strippedTo }&from=${ currentFrom }&content=${ message }`);
			if (response.statusCode === 200) {
				console.log('SMS Mobex response: ', response.content);
				result.resultMsg = response.content;
				result.isSuccess = true;
			} else {
				result.resultMsg = `Could not able to send SMS. Code:  ${ response.statusCode }`;
				console.log('SMS Mobex response: ', response.statusCode);
			}
		} catch (e) {
			result.resultMsg = `Error while sending SMS with Mobex. Detail: ${ e }`;
			console.error('Error while sending SMS with Mobex', e);
		}

		return result;
	}

	async sendBatch(fromNumber, toNumbersArr, message) {
		console.log('Mobex send fromNumber', fromNumber);
		console.log('Mobex send toNumbersArr', toNumbersArr);
		console.log('Mobex send message', message);
		console.log('Mobex send username', this.username);
		console.log('Mobex send rest address', this.restAddress);
		console.log('Mobex send password', this.password);
		console.log('Mobex send from', this.from);

		let currentFrom = this.from;
		if (fromNumber) {
			currentFrom = fromNumber;
		}
		console.log('Mobex send currentFrom', currentFrom);

		const result = {
			isSuccess: false,
			resultMsg: 'An unknown error happened',
			response: false,
		};

		const userPass = `${ this.username }:${ this.password }`;

		const authToken = Base64.encode(userPass);

		try {
			const response = await HTTP.call('POST', `${ this.restAddress }/secure/sendbatch`,
				{
					headers: {
						Authorization: `Basic ${ authToken }`,
					},
					data: {
						messages: [
							{
								to: toNumbersArr,
								from: currentFrom,
								content: message,
							},
						],
					},
				}
			);

			result.isSuccess = true;
			result.resultMsg = 'Success';
			result.response = response;
		} catch (e) {
			result.resultMsg = `Error while sending SMS with Mobex. Detail: ${ e }`;
			console.error('Error while sending SMS with Mobex', e);
		}

		return result;
	}

	response(/* message */) {
		console.log('Mobex response called');
		return {
			headers: {
				'Content-Type': 'text/xml',
			},
			body: 'ACK/Jasmin',
		};
	}

	error(error) {
		console.error('Mobex error called', error);
		let message = '';
		if (error.reason) {
			message = `<Message>${ error.reason }</Message>`;
		}
		return {
			headers: {
				'Content-Type': 'text/xml',
			},
			body: `<Response>${ message }</Response>`,
		};
	}
}

SMS.registerService('mobex', Mobex);
