import { IUser } from '@rocket.chat/core-typings';

export interface IFederatedUserCreationParams {
	name: string;
	username: string;
	existsOnlyOnProxyServer: boolean;
}

export class FederatedUser {
	private externalId: string;

	private existsOnlyOnProxyServer: boolean;

	public internalReference: IUser;

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

	public getUsername(): string | undefined {
		return this.internalReference?.username;
	}

	public getName(): string | undefined {
		return this.internalReference?.name;
	}

	public static isAnInternalUser(fromOriginName: string, localOriginName: string): boolean {
		return fromOriginName === localOriginName;
	}

	public static build(): FederatedUser {
		return new FederatedUser();
	}

	public getExternalId(): string {
		return this.externalId;
	}

	public isRemote(): boolean {
		return !this.existsOnlyOnProxyServer;
	}

	public getInternalId(): string {
		return this.internalReference._id;
	}
}
