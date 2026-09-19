/**
 * An OAuth client registered on the workspace, which lets an outside service
 * sign users in with their Rocket.Chat account.
 *
 * This is the workspace acting as the identity provider. An App that wants to
 * sign *into* somebody else's service wants `OAuth2Client` instead.
 */
export interface IOAuthApp {
	/** The client's identifier on the workspace. */
	id: string;
	/** The client's name, shown to the user on the consent screen. */
	name: string;
	/** Whether the client may be used. */
	active: boolean;
	/** The public identifier the outside service authenticates with. */
	clientId?: string;
	/** The secret the outside service authenticates with. Treat it as a credential. */
	clientSecret?: string;
	/** The only address the workspace will send the user back to. */
	redirectUri: string;
	/** When the client was registered. */
	createdAt?: string;
	/** When the client last changed. */
	updatedAt?: string;
	/** Who registered the client. */
	createdBy: { username: string; id: string };
}

/** The parts of an {@link IOAuthApp} a caller supplies; the workspace fills in the rest. */
export type IOAuthAppParams = Omit<IOAuthApp, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'appId'>;
