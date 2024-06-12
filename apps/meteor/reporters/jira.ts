import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import fetch from 'node-fetch';

class JIRAReporter implements Reporter {
	private url: string;

	private apiKey: string;

	private branch: string;

	private draft: boolean;

	private run: number;

	constructor(options: { url: string; apiKey: string; branch: string; draft: boolean; run: number }) {
		this.url = options.url;
		this.apiKey = options.apiKey;
		this.branch = options.branch;
		this.draft = options.draft;
		this.run = options.run;
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
		};

		console.log(`Sending test result to JIRA: ${JSON.stringify(payload)}`);

		// first search and check if there is an existing issue

		const search = await fetch(
			`${this.url}/rest/api/2/search?${new URLSearchParams({
				jql: `project = FLAKY AND summary ~ '${payload.name}'`,
			})}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Basic ${this.apiKey}`,
				},
			},
		);

		if (!search.ok) {
			throw new Error(
				`JIRA: Failed to search for existing issue: ${search.statusText}.` +
					`${this.url}/rest/api/2/search${new URLSearchParams({
						jql: `project = FLAKY AND summary ~ '${payload.name}'`,
					})}`,
			);
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

		const responseIssue = await fetch(`${this.url}/rest/api/2/issue`, {
			method: 'POST',
			body: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Basic ${this.apiKey}`,
			},
		});

		const issue = (await responseIssue.json()).key;

		await fetch(`${this.url}/rest/api/2/issue/${issue}/comment`, {
			method: 'POST',
			body: JSON.stringify({
				Body: `Test run ${payload.run} failed
branch: ${payload.branch}`,
			}),
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Basic ${this.apiKey}`,
			},
		});
	}
}

export default JIRAReporter;
