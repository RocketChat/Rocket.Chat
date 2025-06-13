export class FederatedHomeserverUser {
	public static readonly HOMESERVER_FEDERATION_TYPE = 'homeserver' as const;

	constructor(
		protected internalId: string,
		protected externalId: string,
		protected username: string,
		protected displayName?: string,
		protected avatarUrl?: string,
		protected homeserverDomain?: string,
	) {}

	public getInternalId(): string {
		return this.internalId;
	}

	public getExternalId(): string {
		return this.externalId;
	}

	public getUsername(): string {
		return this.username;
	}

	public getDisplayName(): string | undefined {
		return this.displayName;
	}

	public getAvatarUrl(): string | undefined {
		return this.avatarUrl;
	}

	public getHomeserverDomain(): string | undefined {
		return this.homeserverDomain;
	}

	public isRemote(): boolean {
		return !!this.homeserverDomain;
	}

	public static createFromExternalId(externalId: string): FederatedHomeserverUser {
		// Expected format: @username:homeserver.domain
		if (!externalId.startsWith('@')) {
			throw new Error(`Invalid homeserver user ID format: ${externalId}`);
		}
		
		const parts = externalId.substring(1).split(':');
		if (parts.length !== 2) {
			throw new Error(`Invalid homeserver user ID format: ${externalId}`);
		}
		
		const [username, domain] = parts;
		return new FederatedHomeserverUser(
			'', // Internal ID to be set later
			externalId,
			username,
			undefined,
			undefined,
			domain,
		);
	}

	public static createFromInternalUser(
		internalId: string,
		username: string,
		displayName?: string,
		domain?: string,
	): FederatedHomeserverUser {
		const externalId = domain ? `@${username}:${domain}` : `@${username}:local`;
		return new FederatedHomeserverUser(
			internalId,
			externalId,
			username,
			displayName,
			undefined,
			domain,
		);
	}

	public toJSON(): Record<string, unknown> {
		return {
			internalId: this.internalId,
			externalId: this.externalId,
			username: this.username,
			displayName: this.displayName,
			avatarUrl: this.avatarUrl,
			homeserverDomain: this.homeserverDomain,
			federationType: FederatedHomeserverUser.HOMESERVER_FEDERATION_TYPE,
		};
	}
}