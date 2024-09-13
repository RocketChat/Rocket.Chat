import { afterEach } from 'mocha';
import type { Response } from 'supertest';

import { request } from '../data/api-data';

const methods = ['get', 'post', 'put', 'del'] as const;

let lastUrl: string;
let lastMethod: string;
let lastResponse: Response;

methods.forEach((method) => {
	const original = request[method];
	request[method] = function (url, fn) {
		lastUrl = url;
		lastMethod = method;
		return original(url, fn).expect((res) => {
			lastResponse = res;
		});
	};
});

afterEach(async function () {
	if (this.currentTest?.state === 'failed') {
		console.log({
			lastUrl,
			lastMethod,
			lastResponse: lastResponse.text,
		});
	}
});
