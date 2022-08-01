import { IUser } from '@rocket.chat/core-typings';

export interface IFederatedUserCreationParams {
	name: string;
	username: string;
	existsOnlyOnProxyServer: boolean;
}

export class FederatedUser {
	protected externalId: string;

	protected existsOnlyOnProxyServer: boolean;

	protected internalReference: IUser;

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

	public static createLocalInstanceOnly(params: IFederatedUserCreationParams): FederatedUser {
		return Object.assign(new FederatedUser(), {
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

	public static createInstanceWithInternalUser(externalId: string, existsOnlyOnProxyServer: boolean, internalReference: IUser): FederatedUser {
		return Object.assign(new FederatedUser(), {
			externalId,
			existsOnlyOnProxyServer,
			internalReference,
		});
	}

	public getInternalReference(): Readonly<IUser> {
		return Object.freeze(this.internalReference);
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
