import 'reflect-metadata';

import { toUnpaddedBase64 } from '@hs/core';
import { ConfigService, createFederationContainer } from '@hs/federation-sdk';
import type { DependencyContainer, FederationContainerOptions, HomeserverEventSignatures } from '@hs/federation-sdk';
import { Emitter } from '@rocket.chat/emitter';

let container: DependencyContainer | undefined;

export async function setup(
	emitter: Emitter<HomeserverEventSignatures> = new Emitter<HomeserverEventSignatures>(),
): Promise<DependencyContainer> {
	const config = new ConfigService();
	const matrixConfig = config.getMatrixConfig();
	const serverConfig = config.getServerConfig();
	const signingKeys = await config.getSigningKey();
	const signingKey = signingKeys[0];

	const containerOptions: FederationContainerOptions = {
		emitter,
		federationOptions: {
			serverName: matrixConfig.serverName,
			signingKey: toUnpaddedBase64(signingKey.privateKey),
			signingKeyId: `ed25519:${signingKey.version}`,
			timeout: 30000,
			baseUrl: serverConfig.baseUrl,
		},
	};

	container = createFederationContainer(containerOptions);

	return container;
}

export function getContainer(): DependencyContainer {
	if (!container) {
		throw new Error('Federation container is not initialized. Call setup() first.');
	}
	return container;
}
