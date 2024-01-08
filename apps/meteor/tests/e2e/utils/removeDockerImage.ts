import child_process from 'child_process';

export const removeDockerImage = (imageName: string, containerPath: string) => {
	try {
		child_process.spawn('docker', ['rmi', imageName], {
			cwd: containerPath,
		});
	} catch {
		// ignore errors here
	}
}