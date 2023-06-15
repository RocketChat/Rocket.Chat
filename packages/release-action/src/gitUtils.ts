import { exec } from '@actions/exec';

export async function setupGitUser() {
	await exec('git', ['config', 'user.name', '"github-actions[bot]"']);
	await exec('git', ['config', 'user.email', '"github-actions[bot]@users.noreply.github.com"']);
}
