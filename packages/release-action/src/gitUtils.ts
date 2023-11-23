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
