import { HTTP } from 'meteor/http';
import { Base64 } from 'meteor/base64';

import { settings } from '../../../settings/server';
import { SMS, SMSServiceClass } from '../SMS';
import { SystemLogger } from '../../../../server/lib/logger/system';

// Here, i wanted to use: Record<`MediaContentType${number}` | `MediaUrl${number}`, string> instead of the index sig, but it doesnt work on our ts version :(
type UnparsedData = { [k: string]: string } & {
	from: string;
	to: string;
	NumMedia: string;
	content: string;
};

type ParsedData = {
	from: string;
	to: string;
	body: string;
	media: { url: string; contentType: string }[];
};

class Mobex extends SMSServiceClass {
	address: string;

	restAddress: string;

	username: string;

	password: string;

	from: string;

	constructor() {
		super();
		this.address = settings.get('SMS_Mobex_gateway_address');
		this.restAddress = settings.get('SMS_Mobex_restful_address');
		this.username = settings.get('SMS_Mobex_username');
		this.password = settings.get('SMS_Mobex_password');
		this.from = settings.get('SMS_Mobex_from_number');
	}

	parse(data: UnparsedData): ParsedData {
		let numMedia = 0;

		const returnData: ParsedData = {
			from: data.from,
			to: data.to,
			body: data.content,
			media: [],
		};

		if (data.NumMedia) {
			numMedia = parseInt(data.NumMedia, 10);
		}

		if (isNaN(numMedia)) {
			SystemLogger.error(`Error parsing NumMedia ${data.NumMedia}`);
			return returnData;
		}

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

	send(
		fromNumber: string,
		toNumber: string,
		message: string,
		username?: string,
		password?: string,
		address?: string,
	): { isSuccess: boolean; resultMsg: string } {
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
				result.resultMsg = response.content || '';
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

	async sendBatch(
		fromNumber: string,
		toNumbersArr: string[],
		message: string,
	): Promise<{ isSuccess: boolean; resultMsg: string; response: HTTP.HTTPResponse | null }> {
		let currentFrom = this.from;
		if (fromNumber) {
			currentFrom = fromNumber;
		}

		const result: { isSuccess: boolean; resultMsg: string; response: HTTP.HTTPResponse | null } = {
			isSuccess: false,
			resultMsg: 'An unknown error happened',
			response: null,
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
			result.response = response || '';
		} catch (e) {
			result.resultMsg = `Error while sending SMS with Mobex. Detail: ${e}`;
			SystemLogger.error('Error while sending SMS with Mobex', e);
		}

		return result;
	}

	response(/* message */): { headers: { [key: string]: string }; body: string } {
		return {
			headers: {
				'Content-Type': 'text/xml',
			},
			body: 'ACK/Jasmin',
		};
	}

	error(error: Error & { reason?: string }): { headers: { [key: string]: string }; body: string } {
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
