import type { ILivechatRoom, IVisitor, IVisitorExternalIdentifier, ResolveVisitorContactData } from '../livechat';
import type { IUser } from '../users';

export interface IExtraRoomParams {
	source?: ILivechatRoom['source'];
	customFields?: {
		[key: string]: unknown;
	};
}

export interface ILivechatCreator {
	/**
	 * Resolves a visitor by external identifier (e.g., WhatsApp BSUID) with contact data fallback.
	 * If found by contact data (phone or email) but not by externalId, enriches the visitor record with the externalId.
	 * @param externalId The external identifier containing entityId and optional metadata (e.g., `{ entityId: 'bsuid-123', metadata: { username: '@user' } }`)
	 * @param contactData Optional contact data for fallback lookup. Use `{ phone: '+1234567890' }` or `{ email: 'user@example.com' }`
	 * @returns The visitor if found, undefined otherwise
	 */
	resolveVisitor(
		externalId: Omit<IVisitorExternalIdentifier, 'appId'>,
		contactData?: ResolveVisitorContactData,
	): Promise<IVisitor | undefined>;
	/**
	 * Creates a room to connect the `visitor` to an `agent`.
	 *
	 * This method uses the Livechat routing method configured
	 * in the server
	 *
	 * @param visitor The Livechat Visitor that started the conversation
	 * @param agent The agent responsible for the room
	 */
	createRoom(visitor: IVisitor, agent: IUser, extraParams?: IExtraRoomParams): Promise<ILivechatRoom>;

	/**
	 * @deprecated Use `createAndReturnVisitor` instead.
	 * Creates a Livechat visitor
	 *
	 * @param visitor Data of the visitor to be created
	 */
	createVisitor(visitor: IVisitor): Promise<string>;

	/**
	 * Creates a Livechat visitor
	 *
	 * @param visitor Data of the visitor to be created
	 */
	createAndReturnVisitor(visitor: IVisitor): Promise<IVisitor | undefined>;

	/**
	 * Creates a token to be used when
	 * creating a new livechat visitor
	 */
	createToken(): string;
}
