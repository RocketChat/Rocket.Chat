export class FederatedHomeserverRoom {
	public static readonly HOMESERVER_FEDERATION_TYPE = 'homeserver' as const;

	constructor(
		protected internalId: string,
		protected externalId: string,
		protected name: string,
		protected topic?: string,
		protected isPublic: boolean = false,
		protected members: string[] = [],
		protected homeserverDomain?: string,
	) {}

	public getInternalId(): string {
		return this.internalId;
	}

	public getExternalId(): string {
		return this.externalId;
	}

	public getName(): string {
		return this.name;
	}

	public getTopic(): string | undefined {
		return this.topic;
	}

	public isPublicRoom(): boolean {
		return this.isPublic;
	}

	public getMembers(): string[] {
		return this.members;
	}

	public getHomeserverDomain(): string | undefined {
		return this.homeserverDomain;
	}

	public isHomeserverRoom(): boolean {
		return true;
	}

	public isRemote(): boolean {
		return !!this.homeserverDomain;
	}

	public static createFromExternalId(externalId: string): FederatedHomeserverRoom {
		// Expected format: !roomid:homeserver.domain
		if (!externalId.startsWith('!')) {
			throw new Error(`Invalid homeserver room ID format: ${externalId}`);
		}
		
		const colonIndex = externalId.indexOf(':');
		if (colonIndex === -1) {
			throw new Error(`Invalid homeserver room ID format: ${externalId}`);
		}
		
		const roomId = externalId.substring(1, colonIndex);
		const domain = externalId.substring(colonIndex + 1);
		
		return new FederatedHomeserverRoom(
			'', // Internal ID to be set later
			externalId,
			roomId, // Use room ID as initial name
			undefined,
			false,
			[],
			domain,
		);
	}

	public static createFromInternalRoom(
		internalId: string,
		name: string,
		topic?: string,
		isPublic: boolean = false,
		domain?: string,
	): FederatedHomeserverRoom {
		// Generate a unique room ID
		const roomId = Math.random().toString(36).substring(2, 15);
		const externalId = domain ? `!${roomId}:${domain}` : `!${roomId}:local`;
		
		return new FederatedHomeserverRoom(
			internalId,
			externalId,
			name,
			topic,
			isPublic,
			[],
			domain,
		);
	}

	public addMember(userId: string): void {
		if (!this.members.includes(userId)) {
			this.members.push(userId);
		}
	}

	public removeMember(userId: string): void {
		const index = this.members.indexOf(userId);
		if (index > -1) {
			this.members.splice(index, 1);
		}
	}

	public hasMember(userId: string): boolean {
		return this.members.includes(userId);
	}

	public toJSON(): Record<string, unknown> {
		return {
			internalId: this.internalId,
			externalId: this.externalId,
			name: this.name,
			topic: this.topic,
			isPublic: this.isPublic,
			members: this.members,
			homeserverDomain: this.homeserverDomain,
			federationType: FederatedHomeserverRoom.HOMESERVER_FEDERATION_TYPE,
		};
	}
}