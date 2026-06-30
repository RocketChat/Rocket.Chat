import type { Response } from 'supertest';

import { request } from '../data/api-data';

const methods = ['get', 'post', 'put', 'del', 'delete'] as const;

let lastUrl: string;
let lastMethod: string;
let lastBody: unknown;
let lastQuery: unknown;
let lastResponse: Response | undefined;

methods.forEach((method) => {
	const original = request[method];
	request[method] = function (url) {
		lastUrl = url;
		lastMethod = method;
		lastBody = undefined;
		lastQuery = undefined;
		lastResponse = undefined;

		const test = original(url);
		const originalSend = test.send.bind(test);
		const originalQuery = test.query.bind(test);
		test.send = (data) => {
			lastBody = data;
			return originalSend(data);
		};
		test.query = (data) => {
			lastQuery = data;
			return originalQuery(data);
		};

		return test.expect((res) => {
			lastResponse = res;
		});
	};
});

export const getLastRequest = () => ({ lastUrl, lastMethod, lastBody, lastQuery, lastResponse });
