import fs from 'fs';

function hasDockerEnv() {
	try {
		fs.statSync('/.dockerenv');
		return true;
	} catch (err) {
		return false;
	}
}

function hasDockerCGroup() {
	try {
		return fs.readFileSync('/proc/self/cgroup', 'utf8').indexOf('docker') !== -1;
	} catch (err) {
		return false;
	}
}

function check() {
	return hasDockerEnv() || hasDockerCGroup();
}

let isDocker;
RocketChat.isDocker = function() {
	if (isDocker === undefined) {
		isDocker = check();
	}

	return isDocker;
};
