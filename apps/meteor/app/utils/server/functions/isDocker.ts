import fs from 'fs';

function hasDockerEnv(): boolean {
	try {
		fs.statSync('/.dockerenv');
		return true;
	} catch (err) {
		return false;
	}
}

function hasDockerCGroup(): boolean {
	try {
		return fs.readFileSync('/proc/self/cgroup', 'utf8').indexOf('docker') !== -1;
	} catch (err) {
		return false;
	}
}

function check(): boolean {
	return hasDockerEnv() || hasDockerCGroup();
}

let _isDocker: boolean;
export const isDocker = function (): boolean {
	if (_isDocker === undefined) {
		_isDocker = check();
	}

	return _isDocker;
};
