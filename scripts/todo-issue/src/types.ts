export interface Config {
	token: string;
	owner: string;
	repo: string;
	importAll: boolean;
	shaInput: string;
	pathFilter: string;
	baseSha?: string;
	headSha?: string;
}

export interface GitHubIssue {
	number: number;
	title: string;
	state: 'open' | 'closed';
	assignees: { login: string }[];
}

export interface TodoItem {
	type: 'add' | 'del';
	title: string;
	body: string | false;
	filename: string;
	line: number;
	labels: string[];
	assignees: string[];
	issueId?: number;
	similarIssueId?: number;
}

export interface MatchResult {
	toCreate: TodoItem[];
	toClose: TodoItem[];
	toUpdate: TodoItem[];
	toReference: TodoItem[];
}
