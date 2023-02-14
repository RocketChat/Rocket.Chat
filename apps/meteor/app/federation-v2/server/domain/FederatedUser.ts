import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { ObjectId } from 'mongodb'; // This should not be in the domain layer, but its a known "problem"

import { isAnInternalIdentifier } from './FederatedRoom';

export interface IFederatedUserCreationParams {
	name: string;
	username: string;
	existsOnlyOnProxyServer: boolean;
}

export class FederatedUser {
	protected externalId: string;

	protected internalId: string;

	protected existsOnlyOnProxyServer: boolean;

	protected internalReference: IUser;

	protected constructor({
		externalId,
		internalReference,
		existsOnlyOnProxyServer,
	}: {
		externalId: string;
		internalReference: IUser;
		existsOnlyOnProxyServer: boolean;
	}) {
		this.externalId = externalId;
		this.existsOnlyOnProxyServer = existsOnlyOnProxyServer;
		this.internalReference = internalReference;
		this.internalId = internalReference._id || new ObjectId().toHexString();
	}

	public static createInstance(externalId: string, params: IFederatedUserCreationParams): FederatedUser {
		return new FederatedUser({
			externalId,
			existsOnlyOnProxyServer: params.existsOnlyOnProxyServer,
			internalReference: FederatedUser.createLocalInstanceOnly(params),
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

	public static createWithInternalReference(externalId: string, existsOnlyOnProxyServer: boolean, internalReference: IUser): FederatedUser {
		return new FederatedUser({
			externalId,
			existsOnlyOnProxyServer,
			internalReference,
		});
	}

	public getInternalReference(): Readonly<IUser> {
		return Object.freeze({
			...this.internalReference,
			_id: this.internalId,
		});
	}

	public getStorageRepresentation(): Readonly<IUser> {
		return {
			_id: this.internalId,
			username: this.internalReference.username || '',
			type: this.internalReference.type,
			status: this.internalReference.status,
			active: this.internalReference.active,
			roles: this.internalReference.roles,
			name: this.internalReference.name,
			requirePasswordChange: this.internalReference.requirePasswordChange,
			createdAt: new Date(),
			_updatedAt: new Date(),
			federated: this.isRemote(),
		};
	}

	public getUsername(): string | undefined {
		return this.internalReference?.username;
	}

	public getName(): string | undefined {
		return this.internalReference?.name;
	}

	public static isOriginalFromTheProxyServer(fromOriginName: string, localOriginName: string): boolean {
		return isAnInternalIdentifier(fromOriginName, localOriginName);
	}

	public getExternalId(): string {
		return this.externalId;
	}

	public isRemote(): boolean {
		return !this.existsOnlyOnProxyServer;
	}

	public shouldUpdateFederationAvatar(federationAvatarUrl: string): boolean {
		return this.internalReference.federation?.avatarUrl !== federationAvatarUrl;
	}

	public shouldUpdateDisplayName(displayName: string): boolean {
		return this.internalReference.name !== displayName;
	}

	public getInternalId(): string {
		return this.internalId;
	}
}
