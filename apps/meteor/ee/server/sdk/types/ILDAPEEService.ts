export interface ILDAPEEService {
	sync(): Promise<void>;
	syncAvatars(): Promise<void>;
	syncLogout(): Promise<void>;
	syncAbacAttributes(): Promise<void>;
}
