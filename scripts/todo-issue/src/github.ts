import type { Config, GitHubIssue, TodoItem } from './types';

const BLOB_LINES = 5;
const DEFAULT_LABEL_COLOR = '00B0D8';
const RATE_LIMIT_BUFFER = 5;

let rateLimitRemaining = Infinity;
let rateLimitResetAt = 0;

async function waitForRateLimit(): Promise<void> {
	if (rateLimitRemaining > RATE_LIMIT_BUFFER) return;

	const waitMs = rateLimitResetAt * 1000 - Date.now() + 1000;
	if (waitMs <= 0) return;

	console.log(`[RATE] ${rateLimitRemaining} requests left, waiting ${Math.ceil(waitMs / 1000)}s`);
	await new Promise((r) => setTimeout(r, waitMs));
}

function trackRateLimit(response: Response): void {
	const remaining = response.headers.get('x-ratelimit-remaining');
	const reset = response.headers.get('x-ratelimit-reset');

	if (remaining) rateLimitRemaining = parseInt(remaining, 10);
	if (reset) rateLimitResetAt = parseInt(reset, 10);
}

async function githubRequest<T>(endpoint: string, token: string, method = 'GET', body?: unknown): Promise<T> {
	await waitForRateLimit();

	const headers: Record<string, string> = {
		Authorization: `Bearer ${token}`,
		Accept: 'application/vnd.github.v3+json',
		'User-Agent': 'todo-issue-script',
	};
	if (body) {
		headers['Content-Type'] = 'application/json';
	}

	const response = await fetch(`https://api.github.com${endpoint}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	});

	trackRateLimit(response);

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`GitHub API ${method} ${endpoint} failed: ${response.status} ${text}`);
	}

	return response.json();
}

async function graphqlRequest<T>(query: string, variables: Record<string, unknown>, token: string): Promise<T> {
	await waitForRateLimit();

	const response = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			'User-Agent': 'todo-issue-script',
		},
		body: JSON.stringify({ query, variables }),
	});

	trackRateLimit(response);

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`GitHub GraphQL failed: ${response.status} ${text}`);
	}

	const json = (await response.json()) as { data?: T; errors?: { message: string }[] };
	if (json.errors?.length) {
		throw new Error(`GitHub GraphQL errors: ${json.errors.map((e) => e.message).join(', ')}`);
	}

	return json.data as T;
}

export async function getDiffFromApi(endpoint: string, token: string): Promise<string> {
	await waitForRateLimit();

	const response = await fetch(`https://api.github.com${endpoint}`, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github.diff',
			'User-Agent': 'todo-issue-script',
		},
	});

	trackRateLimit(response);

	if (!response.ok) {
		throw new Error(`GitHub API GET ${endpoint} failed: ${response.status}`);
	}

	return response.text();
}

export async function fetchExistingIssues(config: Config): Promise<GitHubIssue[]> {
	console.log('[INFO] Fetching existing issues via GraphQL...');

	const allIssues: GitHubIssue[] = [];
	let cursor: string | null = null;

	const query = `
		query($owner: String!, $repo: String!, $cursor: String) {
			repository(owner: $owner, name: $repo) {
				issues(first: 100, after: $cursor, labels: ["todo"], orderBy: { field: CREATED_AT, direction: DESC }) {
					pageInfo { hasNextPage endCursor }
					nodes {
						number
						title
						state
						assignees(first: 10) { nodes { login } }
					}
				}
			}
		}
	`;

	interface IssuesResponse {
		repository: {
			issues: {
				pageInfo: { hasNextPage: boolean; endCursor: string | null };
				nodes: { number: number; title: string; state: string; assignees: { nodes: { login: string }[] } }[];
			};
		};
	}

	while (true) {
		const data: IssuesResponse = await graphqlRequest<IssuesResponse>(
			query,
			{ owner: config.owner, repo: config.repo, cursor },
			config.token,
		);

		const { nodes, pageInfo } = data.repository.issues;

		for (const node of nodes) {
			allIssues.push({
				number: node.number,
				title: node.title,
				state: node.state === 'OPEN' ? 'open' : 'closed',
				assignees: node.assignees.nodes,
			});
		}

		if (!pageInfo.hasNextPage) break;
		cursor = pageInfo.endCursor;

		if (allIssues.length > 10_000) {
			console.log('[WARN] Reached issue limit (10k), stopping pagination');
			break;
		}
	}

	console.log(`[INFO] Fetched ${allIssues.length} existing issues`);
	return allIssues;
}

function buildIssueBody(todo: TodoItem, owner: string, repo: string, sha: string): string {
	const blobUrl = `https://github.com/${owner}/${repo}/blob/${sha}/${encodeURI(todo.filename)}#L${todo.line}-L${todo.line + BLOB_LINES}`;
	const lines = [
		todo.body || '',
		'',
		`<!-- todo-issue -->`,
		`📝 Found in [\`${todo.filename}#L${todo.line}\`](${blobUrl})`,
		'',
		`Commit: ${sha}`,
	];
	return lines.join('\n');
}

function buildIssueBodyFromGroup(todos: TodoItem[], owner: string, repo: string, sha: string): string {
	const bodies = [...new Set(todos.map((t) => t.body).filter(Boolean))] as string[];
	const locationLines = todos.map((todo) => {
		const blobUrl = `https://github.com/${owner}/${repo}/blob/${sha}/${encodeURI(todo.filename)}#L${todo.line}-L${todo.line + BLOB_LINES}`;
		return `- [\`${todo.filename}#L${todo.line}\`](${blobUrl})`;
	});
	const lines = [
		bodies.join('\n\n') || '',
		'',
		`<!-- todo-issue -->`,
		`📝 Found in ${todos.length} location(s):`,
		'',
		...locationLines,
		'',
		`Commit: ${sha}`,
	];
	return lines.join('\n');
}

async function ensureLabelExists(owner: string, repo: string, label: string, token: string): Promise<void> {
	try {
		await githubRequest(`/repos/${owner}/${repo}/labels`, token, 'POST', {
			name: label,
			color: DEFAULT_LABEL_COLOR,
		});
	} catch (err) {
		if (!String(err).includes('422')) throw err;
	}
}

function mergeTodoGroup(todos: TodoItem[]): TodoItem {
	const first = todos[0];
	const labels = [...new Set(todos.flatMap((t) => t.labels))];
	const assignees = [...new Set(todos.flatMap((t) => t.assignees))];
	return { ...first, labels, assignees };
}

export async function createIssue(todoOrGroup: TodoItem | TodoItem[], config: Config, sha: string): Promise<void> {
	const group = Array.isArray(todoOrGroup) ? todoOrGroup : [todoOrGroup];
	const todo = mergeTodoGroup(group);

	for (const label of todo.labels) {
		await ensureLabelExists(config.owner, config.repo, label, config.token);
	}

	const body = group.length > 1 ? buildIssueBodyFromGroup(group, config.owner, config.repo, sha) : buildIssueBody(todo, config.owner, config.repo, sha);

	const locations = group.map((t) => `${t.filename}#L${t.line}`).join(', ');
	console.log(`[CREATE] "${todo.title}" (${locations})`);

	const payload: Record<string, unknown> = {
		title: todo.title,
		body,
		labels: todo.labels,
		...(todo.assignees.length && { assignees: todo.assignees }),
	};

	try {
		await githubRequest(`/repos/${config.owner}/${config.repo}/issues`, config.token, 'POST', payload);
	} catch (err) {
		if (todo.assignees.length && String(err).includes('422')) {
			console.log(`[WARN] Assignees ${todo.assignees.join(', ')} may be invalid, retrying without them`);
			delete payload.assignees;
			await githubRequest(`/repos/${config.owner}/${config.repo}/issues`, config.token, 'POST', payload);
		} else {
			throw err;
		}
	}
}

export async function closeIssue(todo: TodoItem, config: Config, sha: string): Promise<void> {
	if (!todo.issueId) return;

	console.log(`[CLOSE] #${todo.issueId}: "${todo.title}"`);

	await githubRequest(`/repos/${config.owner}/${config.repo}/issues/${todo.issueId}/comments`, config.token, 'POST', {
		body: `This TODO was removed in commit ${sha}.\n\nClosing automatically.`,
	});

	await githubRequest(`/repos/${config.owner}/${config.repo}/issues/${todo.issueId}`, config.token, 'PATCH', {
		state: 'closed',
		state_reason: 'completed',
	});
}

export async function updateIssue(todo: TodoItem, config: Config): Promise<void> {
	if (!todo.issueId) return;

	console.log(`[UPDATE] #${todo.issueId} → "${todo.title}"`);

	await githubRequest(`/repos/${config.owner}/${config.repo}/issues/${todo.issueId}`, config.token, 'PATCH', {
		title: todo.title,
	});
}

export async function addReferenceToIssue(todo: TodoItem, config: Config, sha: string): Promise<void> {
	if (!todo.similarIssueId) return;

	const blobUrl = `https://github.com/${config.owner}/${config.repo}/blob/${sha}/${encodeURI(todo.filename)}#L${todo.line}-L${todo.line + BLOB_LINES}`;

	console.log(`[REFERENCE] #${todo.similarIssueId} ← ${todo.filename}#L${todo.line}`);

	await githubRequest(`/repos/${config.owner}/${config.repo}/issues/${todo.similarIssueId}/comments`, config.token, 'POST', {
		body: [
			`Also referenced in [\`${todo.filename}#L${todo.line}\`](${blobUrl})`,
			'',
			`> ${todo.title}`,
			'',
			`Commit: ${sha}`,
		].join('\n'),
	});
}
