import { afterEach } from 'mocha';

import { request } from '../data/api-data.js';

const methods = ['get', 'post', 'put', 'del'];

let lastUrl;
let lastMethod;
let lastResponse;

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
	if (this.currentTest.state === 'failed') {
		console.log({
			lastUrl,
			lastMethod,
			lastResponse: lastResponse.text,
		});
	}
});
