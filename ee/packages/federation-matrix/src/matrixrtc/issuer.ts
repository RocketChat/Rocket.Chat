/** This server's SFU, as federated call members are told about it. */
export type MatrixRTCOwnTransport = {
	/** The SFU's WebSocket address, reachable by every member's browser. */
	url: string;
	/** Where members of other servers obtain tokens for it with an OpenID token: the lk-jwt-service contract. */
	serviceUrl: string;
};

/** What federated calls need from this server's LiveKit, which the federation package does not configure. */
export interface IMatrixRTCLiveKitIssuer {
	/** Undefined while LiveKit is not configured, which leaves federated calls unavailable. */
	getOwnTransport(): MatrixRTCOwnTransport | undefined;
	/** A token for this server's SFU. */
	mintToken(params: { roomName: string; identity: string; name?: string; canPublish: boolean; hidden?: boolean }): Promise<string>;
}

let issuer: IMatrixRTCLiveKitIssuer | undefined;

/** Set by whoever configures LiveKit; unset when it stops being configured. */
export const setMatrixRTCLiveKitIssuer = (value: IMatrixRTCLiveKitIssuer | undefined): void => {
	issuer = value;
};

export const getMatrixRTCLiveKitIssuer = (): IMatrixRTCLiveKitIssuer | undefined => issuer;
