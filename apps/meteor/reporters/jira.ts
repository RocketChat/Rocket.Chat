import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import fetch from 'node-fetch';

const LOG = '[JIRA reporter]';

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

	private static async ensureJiraOk(response: Awaited<ReturnType<typeof fetch>>, context: string): Promise<void> {
		if (response.ok) {
			return;
		}
		const text = await response.text();
		const preview = text.length > 800 ? `${text.slice(0, 800)}...` : text;
		throw new Error(`${LOG} ${context}: HTTP ${response.status} ${response.statusText}. Body: ${preview}`);
	}

	async onTestEnd(test: TestCase, result: TestResult) {
		try {
			await this._onTestEnd(test, result);
		} catch (error) {
			console.error(`${LOG} Error sending test result to JIRA`, error);
		}
	}

	private async _onTestEnd(test: TestCase, result: TestResult) {
		if (process.env.REPORTER_ROCKETCHAT_REPORT !== 'true') {
			return;
		}

		if (this.draft === true) {
			return;
		}

		if (result.status === 'passed' || result.status === 'skipped') {
			return;
		}

		if (test.expectedStatus === 'failed') {
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

		console.log(`${LOG} preparing notification for flaky/unexpected failure: ${JSON.stringify(payload)}`);

		// first search and check if there is an existing issue
		// replace all ()[]- with nothing
		const search = await fetch(
			`${this.url}/rest/api/3/search/jql?${new URLSearchParams({
				jql: `project = FLAKY AND summary ~ '${payload.name.replace(/[()[\]-]/g, '')}'`,
			})}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Basic ${this.apiKey}`,
				},
			},
		);

		await JIRAReporter.ensureJiraOk(search, 'search for existing issue');

		const { issues } = JSON.parse(await search.text()) as {
			issues: { key: string; fields: { summary: string } }[];
		};

		console.log(`${LOG} JQL search returned ${issues.length} candidate issue(s) (exact summary match is applied next).`);

		const existing = issues.find((issue) => issue.fields.summary === payload.name);

		if (existing) {
			console.log(`${LOG} exact summary match on ${existing.key}; no new issue will be created (comment / label only).`);

			const { location } = test;

			if (this.pr === 0) {
				const labelRes = await fetch(`${this.url}/rest/api/3/issue/${existing.key}`, {
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
				await JIRAReporter.ensureJiraOk(labelRes, `add label flaky_Develop on ${existing.key}`);
				console.log(`${LOG} label update OK for ${existing.key}`);
			}

			const commentRes = await fetch(`${this.url}/rest/api/3/issue/${existing.key}/comment`, {
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
			await JIRAReporter.ensureJiraOk(commentRes, `comment on ${existing.key}`);
			console.log(`${LOG} comment posted on ${existing.key} for run ${payload.run}.`);
			return;
		}

		console.log(`${LOG} no issue with identical summary; creating new FLAKY issue.`);

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

		const responseIssue = await fetch(`${this.url}/rest/api/3/issue`, {
			method: 'POST',
			body: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Basic ${this.apiKey}`,
			},
		});

		await JIRAReporter.ensureJiraOk(responseIssue, 'create issue');

		const created = JSON.parse(await responseIssue.text()) as { key?: string };
		const issue = created.key;
		if (!issue) {
			throw new Error(`${LOG} create issue response had no key: ${JSON.stringify(created)}`);
		}

		console.log(`${LOG} created issue ${issue}.`);

		const { location } = test;

		const commentRes = await fetch(`${this.url}/rest/api/3/issue/${issue}/comment`, {
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
		await JIRAReporter.ensureJiraOk(commentRes, `comment on ${issue}`);
		console.log(`${LOG} comment posted on ${issue}; done for run ${payload.run}.`);
	}
}

export default JIRAReporter;
