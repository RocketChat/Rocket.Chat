// eslint-disable-next-line @typescript-eslint/naming-convention
export interface VoIPUserConfiguration {
	/**
	 * Authorization username.
	 * @defaultValue `""`
	 */
	authUserName: string;
	/**
	 * Authorization password.
	 * @defaultValue `""`
	 */
	authPassword: string;
	/**
	 * SIP Registrar address.
	 * @defaultValue `""`
	 */
	sipRegistrarHostnameOrIP: string;
	/**
	 * SIP WebSocket Path
	 * @defaultValue `""`
	 */
	webSocketURI?: string;
	/**
	 * Option to turn on video
	 * @defaultValue undefined
	 */
	enableVideo?: boolean;
	/**
	 * ConnectionDelegate
	 * @defaultValue null
	 */
	// connectionDelegate?: IConnectionDelegate;
	/**
	 * ICE Server Array
	 * @defaultValue undefined
	 */
	iceServers: Array<object>;
	/**
	 * Voip Retry count
	 * @defaultValue undefined
	 */
	connectionRetryCount: number;
	/**
	 * Enable Keep Alive for unstable networks
	 * @defaultValue undefined
	 */
	enableKeepAliveUsingOptionsForUnstableNetworks: boolean;

	/**
	 * Time to wait for Ice Gathering to complete
	 * @defaultValue 5000
	 */
	iceGatheringTimeout?: number;
}

export interface IMediaStreamRenderer {
	/* @deprecated */
	localMediaElement?: HTMLMediaElement; // TODO: Understand the usage of localMediaElement
	remoteMediaElement: HTMLMediaElement;
}
