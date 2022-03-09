import { UserPresence } from '../client/lib/presence';
import { IMessage } from './IMessage';

export interface IOnUserStreamData {
	roomId: string;
	publicKey: string;
	userId: string;
	refresh?: boolean;
}

export interface IOTRRoom {
	handshake(refresh?: boolean): Promise<void>;
	acknowledge(): void;
	deny(): void;
	end(): void;
	reset(): void;
	generateKeyPair(): Promise<void>;
	importPublicKey(publicKey: any): Promise<void>;
	encryptText(data: Uint8Array): Promise<string>;
	encrypt(message: IMessage): Promise<string>;
	decrypt(message: string): Promise<EJSONableProperty>;
	onUserStream(type: string, data: IOnUserStreamData): Promise<void>;
}

export const userPresenceUsername = async (username: UserPresence['username']): Promise<string> => username as string;
