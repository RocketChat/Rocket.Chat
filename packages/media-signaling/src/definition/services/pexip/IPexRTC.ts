export type PinStatus = 'none' | 'optional' | 'required';

export type CallType = 'none' | 'presentation' | 'screen' | 'audioonly' | 'video' | `recvonly${string}` | 'screen_http' | 'WEBRTC';

export interface IPexRTC {
	screenshare_requested: boolean;

	disconnect(reason?: string, referral?: boolean): void;
	connect(pin?: string, extension?: unknown, idp_uuid?: unknown, sso_token?: unknown): void;
	getPresentation(): void;
	makeCall(node: string, conferenceAlias: string, displayName: string, bandwidth?: string, call_type?: CallType): void;
	present(call_type: 'screen' | 'screen_http' | null): void;
	muteVideo(muted: boolean): void;
	muteAudio(muted: boolean): void;

	onSetup?(localStream: MediaStream | null | undefined, pinStatus: PinStatus, conferenceExtension: unknown, idpChoices: unknown): void;
	onConnect?(remoteStream: MediaStream | null): void;
	onDisconnect?(reason?: string): void;
	onError?(error: unknown): void;
	onPresentation?(setting: boolean, presenter: string, uuid: string, presenter_source: string): void;
	onPresentationConnected?(stream: MediaStream | string | null): void;
	onPresentationDisconnected?(reason?: string): void;
	onScreenshareConnected?(stream: MediaStream | null): void;
	onScreenshareStopped?(reason?: string): void;
}
