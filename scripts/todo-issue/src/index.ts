#!/usr/bin/env bun

import type { Config, TodoItem } from './types';
import { extractTodos } from './diff';
import { matchTodos } from './matcher';
import { isSimilar } from './similarity';
import { fetchExistingIssues, getDiffFromApi, createIssue, closeIssue, updateIssue, addReferenceToIssue } from './github';

function loadConfig(): Config {
	const token = process.env.GITHUB_TOKEN;
	if (!token) throw new Error('GITHUB_TOKEN is required');

	return {
		token,
		owner: process.env.GITHUB_REPOSITORY_OWNER || 'RocketChat',
		repo: process.env.GITHUB_REPOSITORY_NAME || 'Rocket.Chat',
		importAll: process.env.IMPORT_ALL === 'true',
		shaInput: process.env.SHA_INPUT || '',
		pathFilter: process.env.PATH_FILTER || '',
		baseSha: process.env.BEFORE_SHA,
		headSha: process.env.GITHUB_SHA,
	};
}

function execGitDiff(args: string[]): string {
	const { spawnSync } = require('child_process');
	const result = spawnSync('git', ['diff', '--no-index', ...args], {
		encoding: 'utf-8',
		maxBuffer: 50 * 1024 * 1024,
	});
	return result.stdout ?? '';
}

async function getDiff(config: Config): Promise<{ diffText: string; resolvedHeadSha: string }> {
	if (config.importAll) {
		console.log('[INFO] Import-all mode: scanning entire codebase');
		return {
			diffText: execGitDiff(['/dev/null', '.']),
			resolvedHeadSha: config.headSha || 'HEAD',
		};
	}

	if (config.pathFilter) {
		console.log(`[INFO] Path mode: scanning "${config.pathFilter}"`);
		return {
			diffText: execGitDiff(['/dev/null', '--', config.pathFilter]),
			resolvedHeadSha: config.headSha || 'HEAD',
		};
	}

	if (config.shaInput) {
		let fromSha: string;
		let toSha: string;

		if (config.shaInput.includes('...')) {
			[fromSha, toSha] = config.shaInput.split('...');
		} else {
			fromSha = `${config.shaInput}~1`;
			toSha = config.shaInput;
		}

		console.log(`[INFO] SHA mode: comparing ${fromSha}...${toSha}`);
		return {
			diffText: await getDiffFromApi(`/repos/${config.owner}/${config.repo}/compare/${fromSha}...${toSha}`, config.token),
			resolvedHeadSha: toSha,
		};
	}

	if (!config.baseSha || !config.headSha) {
		throw new Error('BEFORE_SHA and GITHUB_SHA are required for push mode');
	}

	console.log(`[INFO] Push mode: comparing ${config.baseSha.slice(0, 7)}...${config.headSha.slice(0, 7)}`);
	return {
		diffText: await getDiffFromApi(`/repos/${config.owner}/${config.repo}/compare/${config.baseSha}...${config.headSha}`, config.token),
		resolvedHeadSha: config.headSha,
	};
}

async function run(): Promise<void> {
	console.log('[INFO] Starting todo-issue');

	const config = loadConfig();
	console.log(`[INFO] Repository: ${config.owner}/${config.repo}`);

	const { diffText, resolvedHeadSha } = await getDiff(config);

	const todos = extractTodos(diffText);
	const added = todos.filter((t) => t.type === 'add').length;
	const deleted = todos.filter((t) => t.type === 'del').length;
	console.log(`[INFO] Found ${todos.length} TODOs (${added} added, ${deleted} deleted)`);

	if (todos.length === 0) {
		console.log('[INFO] No TODOs found, exiting');
		return;
	}

	const existingIssues = await fetchExistingIssues(config);

	if (config.importAll || config.pathFilter) {
		const added = todos
			.filter((t) => t.type === 'add')
			.filter((todo) => {
				return !existingIssues.find((i) => i.title === todo.title || isSimilar(i.title, todo.title));
			});

		const byTitle = new Map<string, TodoItem[]>();
		for (const todo of added) {
			const list = byTitle.get(todo.title) ?? [];
			list.push(todo);
			byTitle.set(todo.title, list);
		}

		console.log(`[INFO] Import: ${byTitle.size} new issues to create (${added.length} TODOs grouped by title)`);

		for (const group of byTitle.values()) {
			await createIssue(group, config, resolvedHeadSha);
		}
	} else {
		const { toCreate, toClose, toUpdate, toReference } = matchTodos(todos, existingIssues);

		const createByTitle = new Map<string, TodoItem[]>();
		for (const todo of toCreate) {
			const list = createByTitle.get(todo.title) ?? [];
			list.push(todo);
			createByTitle.set(todo.title, list);
		}

		console.log(
			`[INFO] Actions: ${createByTitle.size} create, ${toClose.length} close, ${toUpdate.length} update, ${toReference.length} reference`,
		);

		for (const group of createByTitle.values()) {
			await createIssue(group, config, resolvedHeadSha);
		}

		for (const todo of toClose) {
			await closeIssue(todo, config, resolvedHeadSha);
		}

		for (const todo of toUpdate) {
			await updateIssue(todo, config);
		}

		for (const todo of toReference) {
			await addReferenceToIssue(todo, config, resolvedHeadSha);
		}
	}

	console.log('[INFO] Done');
}

run().catch((err) => {
	console.error('[FATAL]', err);
	process.exit(1);
});
