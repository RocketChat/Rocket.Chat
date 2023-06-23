import { exec } from '@actions/exec';

export async function setupGitUser() {
	await exec('git', ['config', 'user.name', '"rocketchat-github-ci"']);
	await exec('git', ['config', 'user.email', '"buildmaster@rocket.chat"']);
}
