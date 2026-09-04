import { exec, getExecOutput } from '@actions/exec';

export async function setupGitUser() {
	await exec('git', ['config', 'user.name', '"rocketchat-github-ci"']);
	await exec('git', ['config', 'user.email', '"buildmaster@rocket.chat"']);
}

export async function createBranch(newBranch: string) {
	await exec('git', ['checkout', '-b', newBranch]);
}

export async function checkoutBranch(branchName: string) {
	await exec('git', ['checkout', branchName]);
}

export async function mergeBranch(branchName: string) {
	await exec('git', ['merge', '--no-edit', branchName]);
}

export async function commitChanges(commitMessage: string) {
	await exec('git', ['add', '.']);
	await exec('git', ['commit', '-m', commitMessage]);
}

export async function createTag(version: string) {
	// create an annotated tag so git push --follow-tags will push the tag
	await exec('git', ['tag', version, '-m', version]);
}

export async function getCurrentBranch() {
	const { stdout: branchName } = await getExecOutput('git', ['rev-parse', '--abbrev-ref', 'HEAD']);

	return branchName.trim();
}

export async function pushChanges() {
	await exec('git', ['push', '--follow-tags']);
}

export async function fetchRefs(refs: string[]) {
	await exec('git', ['fetch', 'origin', ...refs]);
}

// reset/create a local branch pointing at the given ref (e.g. origin/develop)
export async function resetBranchTo(branch: string, ref: string) {
	await exec('git', ['checkout', '-B', branch, ref]);
}

// start a merge but leave it uncommitted so conflicts can be inspected/resolved.
// returns true when the merge applied cleanly, false when there are conflicts.
export async function mergeNoCommit(ref: string): Promise<boolean> {
	const code = await exec('git', ['merge', '--no-commit', '--no-ff', ref], { ignoreReturnCode: true });
	return code === 0;
}

export async function abortMerge() {
	await exec('git', ['merge', '--abort']);
}

export async function getConflictedFiles(): Promise<string[]> {
	const { stdout } = await getExecOutput('git', ['diff', '--name-only', '--diff-filter=U']);

	return stdout
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
}

// resolve a conflicted file by keeping our side (the branch we merge into)
export async function checkoutOurs(file: string) {
	await exec('git', ['checkout', '--ours', '--', file]);
}

export async function addFiles(files: string[]) {
	if (files.length === 0) {
		return;
	}

	await exec('git', ['add', '--', ...files]);
}

// true when `ancestor` is reachable from `descendant` (nothing to sync)
export async function isAncestor(ancestor: string, descendant: string): Promise<boolean> {
	const code = await exec('git', ['merge-base', '--is-ancestor', ancestor, descendant], { ignoreReturnCode: true });

	return code === 0;
}

export async function getShortSha(ref: string): Promise<string> {
	const { stdout } = await getExecOutput('git', ['rev-parse', '--short', ref]);

	return stdout.trim();
}

// contents of a file at a given ref (e.g. origin/master:package.json) or merge stage (e.g. :2:CHANGELOG.md)
export async function showFile(ref: string): Promise<string> {
	const { stdout } = await getExecOutput('git', ['show', ref]);

	return stdout;
}

export async function pushNewBranch(newBranch: string, force = false) {
	const params = ['push'];

	if (force) {
		params.push('--force');
	}

	params.push('--follow-tags');
	params.push('origin');
	params.push(`HEAD:refs/heads/${newBranch}`);

	await exec('git', params);
}
