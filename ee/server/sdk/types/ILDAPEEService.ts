export interface ILDAPEEService {
	sync(): Promise<void>;
	syncAvatars(): Promise<void>;
}
