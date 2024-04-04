import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import fetch from 'node-fetch';

class RocketChatReporter implements Reporter {
	private url: string;

	private apiKey: string;

	private branch: string;

	private draft: boolean;

	private run: number;

	private headSha: string;

	constructor(options: { url: string; apiKey: string; branch: string; draft: boolean; run: number; headSha: string }) {
		this.url = options.url;
		this.apiKey = options.apiKey;
		this.branch = options.branch;
		this.draft = options.draft;
		this.run = options.run;
		this.headSha = options.headSha;
	}

	onTestEnd(test: TestCase, result: TestResult) {
		if (process.env.REPORTER_ROCKETCHAT_REPORT !== 'true') {
			console.log('REPORTER_ROCKETCHAT_REPORT is not true, skipping', {
				draft: this.draft,
				branch: this.branch,
			});
			return;
		}
		const payload = {
			name: test.title,
			status: result.status,
			duration: result.duration,
			branch: this.branch,
			draft: this.draft,
			run: this.run,
			headSha: this.headSha,
		};
		console.log(`Sending test result to Rocket.Chat: ${JSON.stringify(payload)}`);
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
