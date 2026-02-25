import type { GitHubIssue, MatchResult, TodoItem } from './types';
import { isSimilar } from './similarity';

export function matchTodos(found: TodoItem[], existing: GitHubIssue[]): MatchResult {
	const toCreate: TodoItem[] = [];
	const toClose: TodoItem[] = [];
	const toUpdate: TodoItem[] = [];
	const toReference: TodoItem[] = [];

	const addTodos = found.filter((t) => t.type === 'add');
	const delTodos = found.filter((t) => t.type === 'del');

	for (const del of delTodos) {
		const exactMatch = existing.find((e) => e.title === del.title && e.state === 'open');
		if (exactMatch) {
			del.issueId = exactMatch.number;
		} else {
			const similarMatch = existing.find((e) => isSimilar(e.title, del.title) && e.state === 'open');
			if (similarMatch) {
				del.issueId = similarMatch.number;
			}
		}
	}

	const consumedDels = new Set<TodoItem>();

	for (const add of addTodos) {
		const movedDel = delTodos.find((d) => !consumedDels.has(d) && d.title === add.title);
		if (movedDel) {
			movedDel.issueId = undefined;
			consumedDels.add(movedDel);
			continue;
		}

		const updatedDel = delTodos.find((d) => !consumedDels.has(d) && d.issueId && isSimilar(d.title, add.title));
		if (updatedDel) {
			add.issueId = updatedDel.issueId;
			updatedDel.issueId = undefined;
			consumedDels.add(updatedDel);
			toUpdate.push(add);
			continue;
		}

		const exactExisting = existing.find((e) => e.title === add.title);
		if (exactExisting) {
			add.similarIssueId = exactExisting.number;
			toReference.push(add);
			continue;
		}

		const similarExisting = existing.find((e) => isSimilar(e.title, add.title));
		if (similarExisting) {
			add.similarIssueId = similarExisting.number;
			toReference.push(add);
			continue;
		}

		toCreate.push(add);
	}

	const closedIssueIds = new Set<number>();
	for (const del of delTodos) {
		if (del.issueId && !closedIssueIds.has(del.issueId)) {
			closedIssueIds.add(del.issueId);
			toClose.push(del);
		}
	}

	return { toCreate, toClose, toUpdate, toReference };
}
