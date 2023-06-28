import fetch from 'node-fetch';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

class RocketChatReporter implements Reporter {
	private url: string;

	private apiKey: string;

	constructor(options: { url: string; apiKey: string }) {
		this.url = options.url;
		this.apiKey = options.apiKey;
	}

	onTestEnd(test: TestCase, result: TestResult) {
		const payload = {
			name: test.title,
			status: result.status,
			duration: result.duration,
		};
		return fetch(this.url, {
			method: 'POST',
			body: JSON.stringify(payload),
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': this.apiKey,
			},
		});
	}
}

export default RocketChatReporter;
