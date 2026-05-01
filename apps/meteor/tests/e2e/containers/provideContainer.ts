import child_process from 'child_process';
import path from 'path';

import { v2 as compose } from 'docker-compose';

type ContainerData = {
	containerName: string;
	instanceName: string;
	containerPath: string;
};

const containerData = {
	SAML: {
		containerName: 'saml',
		instanceName: 'testsamlidp_idp',
		containerPath: path.join(__dirname, 'saml'),
	},
	LDAP: {
		containerName: 'ldap',
		instanceName: 'test_openldap',
		containerPath: path.join(__dirname, 'ldap'),
	},
} as const;

export function provideContainer({ instanceName, containerName, containerPath }: ContainerData) {
	const container = {
		build: async () => {
			await compose.buildOne(instanceName, {
				cwd: containerPath,
			});
		},
		up: async () => {
			await compose.upOne(instanceName, {
				cwd: containerPath,
			});
		},

		down: async () => {
			await compose.down({
				cwd: containerPath,
			});
		},

		remove: () => {
			// the compose CLI doesn't have any way to remove images, so try to remove it with a direct call to the docker cli, but ignore errors if it fails.
			try {
				const fullName = `${containerName}-${instanceName}`;
				child_process.spawn('docker', ['rmi', fullName], {
					cwd: containerPath,
				});
			} catch {
				// ignore errors here
			}
		},

		startUp: async () => {
			await container.build();
			await container.up();
		},

		cleanUp: async () => {
			await container.down();
			container.remove();
		},
	} as const;

	return container;
}

export function provideContainerFor(key: keyof typeof containerData) {
	const data = containerData[key];
	if (!data) {
		throw new Error('invalid-container-key');
	}

	return provideContainer(data);
}
