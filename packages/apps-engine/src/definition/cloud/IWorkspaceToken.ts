/**
 * A bearer token for calling Rocket.Chat Cloud on the workspace's behalf.
 *
 * Request one through `ICloudWorkspaceRead`; it needs the
 * `cloud.workspace-token` permission and the scopes that permission declares.
 */
export interface IWorkspaceToken {
	/** The token to send as the request's bearer credential. */
	token: string;
	/** When the token stops being accepted. Request a new one rather than caching past this. */
	expiresAt: Date;
}
