import { IUser, UserStatus } from '@rocket.chat/core-typings';
import { isAnInternalIdentifier } from './FederatedRoom';

export interface IFederatedUserCreationParams {
	name: string;
	username: string;
	existsOnlyOnProxyServer: boolean;
}

export class FederatedUser {
	protected externalId: string;

	protected existsOnlyOnProxyServer: boolean;

	protected internalReference: IUser;

	protected constructor({ externalId, internalReference, existsOnlyOnProxyServer }: { externalId: string, internalReference: IUser, existsOnlyOnProxyServer: boolean }) {
		this.externalId = externalId;
		this.existsOnlyOnProxyServer = existsOnlyOnProxyServer;
		this.internalReference = internalReference;
	}

	public static createInstance(externalId: string, params: IFederatedUserCreationParams): FederatedUser {
		return new FederatedUser({
			externalId,
			existsOnlyOnProxyServer: params.existsOnlyOnProxyServer,
			internalReference: {
				username: params.username,
				name: params.name,
				type: 'user',
				status: UserStatus.ONLINE,
				active: true,
				roles: ['user'],
				requirePasswordChange: false,
			} as unknown as IUser,
		});
	}

	public static createLocalInstanceOnly(params: IFederatedUserCreationParams): IUser {
		return {
			username: params.username,
			name: params.name,
			type: 'user',
			status: UserStatus.ONLINE,
			active: true,
			roles: ['user'],
			requirePasswordChange: false,
			federated: !params.existsOnlyOnProxyServer,
		} as unknown as IUser;
	}

	public static createInstanceWithInternalUser(externalId: string, existsOnlyOnProxyServer: boolean, internalReference: IUser): FederatedUser {
		return new FederatedUser({
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
		return isAnInternalIdentifier(fromOriginName, localOriginName);
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
