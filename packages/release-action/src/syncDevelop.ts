import { writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import * as core from '@actions/core';
import { getExecOutput } from '@actions/exec';
import * as github from '@actions/github';

import {
	abortMerge,
	addFiles,
	checkoutOurs,
	commitChanges,
	fetchRefs,
	getConflictedFiles,
	getShortSha,
	isAncestor,
	mergeNoCommit,
	pushNewBranch,
	resetBranchTo,
	showFile,
} from './gitUtils';
import { setupOctokit } from './setupOctokit';
import { getUpdateFilesList } from './utils';

// Every sync PR title starts with this conventional prefix so it satisfies the
// repo's PR title rules (see .github/PULL_REQUEST_TEMPLATE.md). A branch sync is
// housekeeping with no end-user changelog impact, hence `chore:`.
const TITLE_PREFIX = 'chore: sync develop with master';

const SOURCE = 'master';
const TARGET = 'develop';

type Classification = {
	versionFiles: string[];
	changelogs: string[];
	other: string[];
};

function classifyConflicts(conflicts: string[], extraVersionFiles: string[]): Classification {
	const versionFiles: string[] = [];
	const changelogs: string[] = [];
	const other: string[] = [];

	for (const file of conflicts) {
		const base = path.basename(file);

		if (base === 'package.json' || extraVersionFiles.includes(file)) {
			versionFiles.push(file);
		} else if (base === 'CHANGELOG.md') {
			changelogs.push(file);
		} else {
			other.push(file);
		}
	}

	return { versionFiles, changelogs, other };
}

// Resolve a conflicted CHANGELOG.md with a lossless union of both sides so no
// release notes are dropped. Ordering still needs a human eye, which is why the
// changelog tier always opens a review PR rather than auto-merging.
async function unionMergeChangelog(file: string) {
	const stage = async (n: number) => {
		const tmp = path.join(os.tmpdir(), `changelog-${n}-${path.basename(file)}`);
		await writeFile(tmp, await showFile(`:${n}:${file}`), 'utf8');
		return tmp;
	};

	const [base, ours, theirs] = await Promise.all([stage(1), stage(2), stage(3)]);

	// `git merge-file -p --union` prints the union of ours+theirs (relative to base) to stdout
	const { stdout } = await getExecOutput('git', ['merge-file', '-p', '--union', ours, base, theirs]);

	await writeFile(file, stdout, 'utf8');
}

export async function syncDevelopWithMaster({ githubToken, cwd = process.cwd() }: { githubToken: string; cwd?: string }) {
	const octokit = setupOctokit(githubToken);

	await fetchRefs([SOURCE, TARGET]);

	if (await isAncestor(`origin/${SOURCE}`, `origin/${TARGET}`)) {
		core.info(`origin/${TARGET} already contains origin/${SOURCE}; nothing to sync.`);
		return;
	}

	// the released version, read from master's root package.json — used for titles
	const { version } = JSON.parse(await showFile(`origin/${SOURCE}:package.json`));
	const shortSha = await getShortSha(`origin/${SOURCE}`);
	const syncBranch = `sync/master-to-develop-${shortSha}`;

	// the non-package.json version files (e.g. apps/meteor/app/utils/rocketchat.info)
	const extraVersionFiles = (await getUpdateFilesList(cwd)).filter((file) => path.basename(file) !== 'package.json');

	// branch off develop, then merge master into it
	await resetBranchTo(syncBranch, `origin/${TARGET}`);
	await mergeNoCommit(`origin/${SOURCE}`);

	const conflicts = await getConflictedFiles();
	const { versionFiles, changelogs, other } = classifyConflicts(conflicts, extraVersionFiles);

	// Tier 3: real code conflicts — we can't safely resolve. Open a manual PR with
	// master as-is so a human resolves everything in the PR.
	if (other.length > 0) {
		core.warning(`Unresolvable conflicts require manual review: ${other.join(', ')}`);

		await abortMerge();
		await resetBranchTo(syncBranch, `origin/${SOURCE}`);
		await pushNewBranch(syncBranch, true);

		await ensurePullRequest({
			octokit,
			head: syncBranch,
			title: `${TITLE_PREFIX} (${version}) — manual resolution required`,
			body: manualBody(version, other),
			autoMerge: false,
		});
		return;
	}

	// resolve the predictable conflicts: version lines keep develop's side
	for (const file of versionFiles) {
		await checkoutOurs(file);
	}
	for (const file of changelogs) {
		await unionMergeChangelog(file);
	}
	await addFiles([...versionFiles, ...changelogs]);

	await commitChanges(`${TITLE_PREFIX} (${version})`);
	await pushNewBranch(syncBranch, true);

	// Tier 2: changelog conflicts were auto-resolved but ordering needs review → no auto-merge.
	if (changelogs.length > 0) {
		await ensurePullRequest({
			octokit,
			head: syncBranch,
			title: `${TITLE_PREFIX} (${version}) — review changelog`,
			body: changelogBody(version, changelogs),
			autoMerge: false,
		});
		return;
	}

	// Tier 1: only version lines conflicted (or a clean merge) → safe to auto-merge.
	await ensurePullRequest({
		octokit,
		head: syncBranch,
		title: `${TITLE_PREFIX} (${version})`,
		body: cleanBody(version),
		autoMerge: true,
	});
}

async function ensurePullRequest({
	octokit,
	head,
	title,
	body,
	autoMerge,
}: {
	octokit: ReturnType<typeof setupOctokit>;
	head: string;
	title: string;
	body: string;
	autoMerge: boolean;
}) {
	const { owner, repo } = github.context.repo;

	const { data: existing } = await octokit.rest.pulls.list({
		owner,
		repo,
		state: 'open',
		base: TARGET,
		head: `${owner}:${head}`,
	});

	let nodeId: string;

	if (existing[0]) {
		core.info(`Updating existing sync PR #${existing[0].number}`);
		await octokit.rest.pulls.update({ owner, repo, pull_number: existing[0].number, title, body });
		nodeId = existing[0].node_id;
	} else {
		core.info('Creating sync PR');
		const { data } = await octokit.rest.pulls.create({ owner, repo, base: TARGET, head, title, body });
		nodeId = data.node_id;
	}

	if (autoMerge) {
		await enableAutoMerge(octokit, nodeId);
	}
}

async function enableAutoMerge(octokit: ReturnType<typeof setupOctokit>, pullRequestId: string) {
	try {
		await octokit.graphql(
			`mutation($id: ID!) {
				enablePullRequestAutoMerge(input: { pullRequestId: $id, mergeMethod: MERGE }) {
					pullRequest { number }
				}
			}`,
			{ id: pullRequestId },
		);
	} catch (err) {
		// auto-merge may be disabled on the repo or the PR may already be mergeable; don't fail the sync
		core.warning(`Could not enable auto-merge: ${(err as Error).message}`);
	}
}

function cleanBody(version: string) {
	return [
		`Automated sync of \`${TARGET}\` with \`${SOURCE}\` after releasing **${version}**.`,
		'',
		'Only version-bump conflicts were found; they were resolved in favour of `develop`. Auto-merge is enabled.',
	].join('\n');
}

function changelogBody(version: string, changelogs: string[]) {
	return [
		`Automated sync of \`${TARGET}\` with \`${SOURCE}\` after releasing **${version}**.`,
		'',
		'Version-bump conflicts were resolved in favour of `develop`. The following changelog files conflicted and were',
		'union-merged automatically — **please review the ordering of entries before merging**:',
		'',
		...changelogs.map((file) => `- \`${file}\``),
	].join('\n');
}

function manualBody(version: string, other: string[]) {
	return [
		`Automated sync of \`${TARGET}\` with \`${SOURCE}\` after releasing **${version}**.`,
		'',
		'This sync could not be resolved automatically because of conflicts in files beyond the expected version bumps.',
		'**Resolve the conflicts manually before merging.** Conflicting files:',
		'',
		...other.map((file) => `- \`${file}\``),
	].join('\n');
}
