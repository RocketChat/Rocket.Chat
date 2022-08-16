import type { IUser } from '@rocket.chat/core-typings';

export interface IFederatedUserCreationParams {
	name: string;
	username: string;
	existsOnlyOnProxyServer: boolean;
}

export class FederatedUser {
	public externalId: string;

	public internalReference: IUser;

	public existsOnlyOnProxyServer: boolean;

	// eslint-disable-next-line
	protected constructor() {}

	public static createInstance(externalId: string, params: IFederatedUserCreationParams): FederatedUser {
		return Object.assign(new FederatedUser(), {
			externalId,
			existsOnlyOnProxyServer: params.existsOnlyOnProxyServer,
			internalReference: {
				username: params.username,
				name: params.name,
				type: 'user',
				status: 'online',
				active: true,
				roles: ['user'],
				requirePasswordChange: false,
			},
		});
	}

	public static build(): FederatedUser {
		return new FederatedUser();
	}
}
