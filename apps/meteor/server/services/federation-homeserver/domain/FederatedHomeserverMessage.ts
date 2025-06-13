export class FederatedHomeserverMessage {
	public static readonly HOMESERVER_FEDERATION_TYPE = 'homeserver' as const;

	constructor(
		protected internalId: string,
		protected externalId: string,
		protected roomId: string,
		protected userId: string,
		protected content: string,
		protected timestamp: Date,
		protected edited: boolean = false,
		protected homeserverDomain?: string,
	) {}

	public getInternalId(): string {
		return this.internalId;
	}

	public getExternalId(): string {
		return this.externalId;
	}

	public getRoomId(): string {
		return this.roomId;
	}

	public getUserId(): string {
		return this.userId;
	}

	public getContent(): string {
		return this.content;
	}

	public getTimestamp(): Date {
		return this.timestamp;
	}

	public isEdited(): boolean {
		return this.edited;
	}

	public getHomeserverDomain(): string | undefined {
		return this.homeserverDomain;
	}

	public isRemote(): boolean {
		return !!this.homeserverDomain;
	}

	public static createFromExternalMessage(
		externalId: string,
		roomId: string,
		userId: string,
		content: string,
		timestamp: number,
		edited: boolean = false,
	): FederatedHomeserverMessage {
		// Expected format: $messageid:homeserver.domain
		if (!externalId.startsWith('$')) {
			throw new Error(`Invalid homeserver message ID format: ${externalId}`);
		}
		
		const colonIndex = externalId.indexOf(':');
		if (colonIndex === -1) {
			throw new Error(`Invalid homeserver message ID format: ${externalId}`);
		}
		
		const domain = externalId.substring(colonIndex + 1);
		
		return new FederatedHomeserverMessage(
			'', // Internal ID to be set later
			externalId,
			roomId,
			userId,
			content,
			new Date(timestamp),
			edited,
			domain,
		);
	}

	public static createFromInternalMessage(
		internalId: string,
		roomId: string,
		userId: string,
		content: string,
		timestamp: Date,
		domain?: string,
	): FederatedHomeserverMessage {
		// Generate a unique message ID
		const messageId = Math.random().toString(36).substring(2, 15);
		const externalId = domain ? `$${messageId}:${domain}` : `$${messageId}:local`;
		
		return new FederatedHomeserverMessage(
			internalId,
			externalId,
			roomId,
			userId,
			content,
			timestamp,
			false,
			domain,
		);
	}

	public setContent(content: string): void {
		this.content = content;
		this.edited = true;
	}

	public toJSON(): Record<string, unknown> {
		return {
			internalId: this.internalId,
			externalId: this.externalId,
			roomId: this.roomId,
			userId: this.userId,
			content: this.content,
			timestamp: this.timestamp.toISOString(),
			edited: this.edited,
			homeserverDomain: this.homeserverDomain,
			federationType: FederatedHomeserverMessage.HOMESERVER_FEDERATION_TYPE,
		};
	}
}