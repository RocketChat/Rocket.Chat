export interface IManagementServerConnectionStatus {
	status: 'connected' | 'connection-error';
	error?: string;
}
