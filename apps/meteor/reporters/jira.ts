import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import fetch from 'node-fetch';

class JIRAReporter implements Reporter {
	private url: string;

	private apiKey: string;

	private branch: string;

	private draft: boolean;

	private run: number;

	private headSha: string;

	private author: string;

	private run_url: string;

	private pr: number;

	constructor(options: {
		url: string;
		apiKey: string;
		branch: string;
		draft: boolean;
		run: number;
		headSha: string;
		author: string;
		run_url: string;
		pr: number;
	}) {
		this.url = options.url;
		this.apiKey = options.apiKey;
		this.branch = options.branch;
		this.draft = options.draft;
		this.run = options.run;
		this.headSha = options.headSha;
		this.author = options.author;
		this.run_url = options.run_url;
		this.pr = options.pr;
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

		console.log(`Sending test result to JIRA: ${JSON.stringify(payload)}`);

		// first search and check if there is an existing issue
		// replace all ()[]- with nothing
		const search = await fetch(
			`${this.url}/rest/api/2/search?${new URLSearchParams({
				jql: `project = FLAKY AND summary ~ '${payload.name.replace(/[\(\)\[\]-]/g, '')}'`,
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

		const existing = issues.find(
			(issue: {
				fields: {
					summary: string;
				};
			}) => issue.fields.summary === payload.name,
		);

		if (existing) {
			const { location } = test;

			if (this.pr === 0) {
				await fetch(`${this.url}/rest/api/2/issue/${existing.key}`, {
					method: 'PUT',
					body: JSON.stringify({
						update: {
							labels: [
								{
									add: 'flaky_Develop',
								},
							],
						},
					}),
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Basic ${this.apiKey}`,
					},
				});
			}

			await fetch(`${this.url}/rest/api/2/issue/${existing.key}/comment`, {
				method: 'POST',
				body: JSON.stringify({
					body: `Test run ${payload.run} failed
author: ${this.author}
PR: ${this.pr}
https://github.com/RocketChat/Rocket.Chat/blob/${payload.headSha}/${location.file.replace(
						'/home/runner/work/Rocket.Chat/Rocket.Chat',
						'',
					)}#L${location.line}:${location.column}
${this.run_url}
`,
				}),
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Basic ${this.apiKey}`,
				},
			});
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
				...(this.pr === 0 && { labels: ['flaky_Develop'] }),
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

		const { location } = test;

		await fetch(`${this.url}/rest/api/2/issue/${issue}/comment`, {
			method: 'POST',
			body: JSON.stringify({
				body: `Test run ${payload.run} failed
author: ${this.author}
PR: ${this.pr}
https://github.com/RocketChat/Rocket.Chat/blob/${payload.headSha}/${location.file.replace(
					'/home/runner/work/Rocket.Chat/Rocket.Chat',
					'',
				)}#L${location.line}:${location.column},
${this.run_url}
`,
			}),
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Basic ${this.apiKey}`,
			},
		});
	}
}

export default JIRAReporter;
