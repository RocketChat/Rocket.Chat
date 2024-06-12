import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import fetch from 'node-fetch';

class JIRAReporter implements Reporter {
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

	async onTestEnd(test: TestCase, result: TestResult) {
		if (process.env.REPORTER_ROCKETCHAT_REPORT !== 'true') {
			return;
		}

		if (this.draft === true) {
			return;
		}

		if (result.status === 'passed' || result.status === 'skipped') {
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

		// first search and check if there is an existing issue

		const search = await fetch(
			`${this.url}/rest/api/2/search${new URLSearchParams({
				jql: `project = FLAKY AND summary = '${payload.name}'`,
			})}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'X-Api-Key': this.apiKey,
				},
			},
		);

		if (!search.ok) {
			throw new Error(`JIRA: Failed to search for existing issue: ${search.statusText}`);
		}

		const { issues } = await search.json();

		if (
			issues.some(
				(issue: {
					fields: {
						summary: string;
					};
				}) => issue.fields.summary === payload.name,
			)
		) {
			return;
		}

		const data: {
			fields: {
				summary: string;
				description: string;
				issuetype: {
					name: string;
				};
				project: {
					key: string;
				};
			};
		} = {
			fields: {
				summary: payload.name,
				description: '',
				issuetype: {
					name: 'Tech Debt',
				},
				project: {
					key: 'FLAKY',
				},
			},
		};

		return fetch(`${this.url}/rest/api/2/issue`, {
			method: 'POST',
			body: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': this.apiKey,
			},
		});
	}
}

export default JIRAReporter;
