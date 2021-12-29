import { HTTP } from 'meteor/http';
import { Base64 } from 'meteor/base64';

import { settings } from '../../../settings';
import { SMS } from '../SMS';
import { SystemLogger } from '../../../../server/lib/logger/system';

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

		const returnData = {
			from: data.from,
			to: data.to,
			body: data.content,
		};

		if (data.NumMedia) {
			numMedia = parseInt(data.NumMedia, 10);
		}

		if (isNaN(numMedia)) {
			SystemLogger.error(`Error parsing NumMedia ${data.NumMedia}`);
			return returnData;
		}

		returnData.media = [];

		for (let mediaIndex = 0; mediaIndex < numMedia; mediaIndex++) {
			const media = {
				url: '',
				contentType: '',
			};

			const mediaUrl = data[`MediaUrl${mediaIndex}`];
			const contentType = data[`MediaContentType${mediaIndex}`];

			media.url = mediaUrl;
			media.contentType = contentType;

			returnData.media.push(media);
		}

		return returnData;
	}

	send(fromNumber, toNumber, message, username = null, password = null, address = null) {
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

		const strippedTo = toNumber.replace(/\D/g, '');
		const result = {
			isSuccess: false,
			resultMsg: 'An unknown error happened',
		};

		try {
			const response = HTTP.call(
				'GET',
				`${currentAddress}/send?username=${currentUsername}&password=${currentPassword}&to=${strippedTo}&from=${currentFrom}&content=${message}`,
			);
			if (response.statusCode === 200) {
				result.resultMsg = response.content;
				result.isSuccess = true;
			} else {
				result.resultMsg = `Could not able to send SMS. Code:  ${response.statusCode}`;
			}
		} catch (e) {
			result.resultMsg = `Error while sending SMS with Mobex. Detail: ${e}`;
			SystemLogger.error('Error while sending SMS with Mobex', e);
		}

		return result;
	}

	async sendBatch(fromNumber, toNumbersArr, message) {
		let currentFrom = this.from;
		if (fromNumber) {
			currentFrom = fromNumber;
		}

		const result = {
			isSuccess: false,
			resultMsg: 'An unknown error happened',
			response: false,
		};

		const userPass = `${this.username}:${this.password}`;

		const authToken = Base64.encode(userPass);

		try {
			const response = await HTTP.call('POST', `${this.restAddress}/secure/sendbatch`, {
				headers: {
					Authorization: `Basic ${authToken}`,
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
			});

			result.isSuccess = true;
			result.resultMsg = 'Success';
			result.response = response;
		} catch (e) {
			result.resultMsg = `Error while sending SMS with Mobex. Detail: ${e}`;
			SystemLogger.error('Error while sending SMS with Mobex', e);
		}

		return result;
	}

	response(/* message */) {
		return {
			headers: {
				'Content-Type': 'text/xml',
			},
			body: 'ACK/Jasmin',
		};
	}

	error(error) {
		let message = '';
		if (error.reason) {
			message = `<Message>${error.reason}</Message>`;
		}
		return {
			headers: {
				'Content-Type': 'text/xml',
			},
			body: `<Response>${message}</Response>`,
		};
	}
}

SMS.registerService('mobex', Mobex);
