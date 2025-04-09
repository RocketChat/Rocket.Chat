import { Base64 } from '@rocket.chat/base64';
import type { ISMSProvider, ServiceData, SMSProviderResult, SMSProviderResponse } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { settings } from '../../../../app/settings/server';
import { SystemLogger } from '../../../lib/logger/system';

type MobexData = {
	from: string;
	to: string;
	content: string;
	NumMedia?: string;
} & Record<`MediaUrl${number}`, string> &
	Record<`MediaContentType${number}`, string>;

const isMobexData = (data: unknown): data is MobexData => {
	if (typeof data !== 'object' || data === null) {
		return false;
	}

	const { from, to, content } = data as Record<string, unknown>;

	return typeof from === 'string' && typeof to === 'string' && typeof content === 'string';
};

export class Mobex implements ISMSProvider {
	address: string;

	restAddress: string;

	username: string;

	password: string;

	from: string;

	constructor() {
		this.address = settings.get('SMS_Mobex_gateway_address');
		this.restAddress = settings.get('SMS_Mobex_restful_address');
		this.username = settings.get('SMS_Mobex_username');
		this.password = settings.get('SMS_Mobex_password');
		this.from = settings.get('SMS_Mobex_from_number');
	}

	parse(data: unknown) {
		let numMedia = 0;

		if (!isMobexData(data)) {
			throw new Error('Invalid data');
		}

		const returnData: ServiceData = {
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

	// @ts-expect-error -- typings :) for this method are wrong
	async send(
		fromNumber: string,
		toNumber: string,
		message: string,
		extraData: {
			username?: string;
			password?: string;
			address?: string;
		},
	): Promise<SMSProviderResult> {
		let currentFrom = this.from;
		let currentUsername = this.username;
		let currentAddress = this.address;
		let currentPassword = this.password;

		const { username, password, address } = extraData;
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
		const result: SMSProviderResult = {
			isSuccess: false,
			resultMsg: 'An unknown error happened',
		};

		try {
			const response = await fetch(`${currentAddress}/send`, {
				params: {
					username: currentUsername,
					password: currentPassword,
					to: strippedTo,
					from: currentFrom,
					content: message,
				},
			});

			if (response.ok) {
				result.resultMsg = await response.text();
				result.isSuccess = true;
			} else {
				result.resultMsg = `Could not able to send SMS. Code:  ${response.status}`;
			}
		} catch (err) {
			result.resultMsg = `Error while sending SMS with Mobex. Detail: ${err}`;
			SystemLogger.error({ msg: 'Error while sending SMS with Mobex', err });
		}

		return result;
	}

	async sendBatch(fromNumber: string, toNumbersArr: string[], message: string): Promise<SMSProviderResult> {
		let currentFrom = this.from;
		if (fromNumber) {
			currentFrom = fromNumber;
		}

		const result: SMSProviderResult = {
			isSuccess: false,
			resultMsg: 'An unknown error happened',
			response: null,
		};

		const userPass = `${this.username}:${this.password}`;

		const authToken = Base64.encode(userPass);

		try {
			const response = await fetch(`${this.restAddress}/secure/sendbatch`, {
				method: 'POST',
				headers: {
					Authorization: `Basic ${authToken}`,
				},
				body: {
					messages: [
						{
							to: toNumbersArr,
							from: currentFrom,
							content: message,
						},
					],
				},
			});

			result.isSuccess = response.ok;
			result.resultMsg = 'Success';
			result.response = await response.text();
		} catch (err) {
			result.resultMsg = `Error while sending SMS with Mobex. Detail: ${err}`;
			SystemLogger.error({ msg: 'Error while sending SMS with Mobex', err });
		}

		return result;
	}

	response(): SMSProviderResponse {
		return {
			headers: {
				'Content-Type': 'text/xml',
			},
			body: 'ACK/Jasmin',
		};
	}

	async validateRequest(_request: Request): Promise<boolean> {
		return true;
	}

	error(error: Error & { reason?: string }): SMSProviderResponse {
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
