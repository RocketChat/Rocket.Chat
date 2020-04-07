export {};

declare global {
	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface Window {
		USE_REST_FOR_DDP_CALLS?: boolean;
	}
}
