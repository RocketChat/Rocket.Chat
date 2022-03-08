import { UserPresence } from '../../../client/lib/presence';
// import { ReactiveVar } from 'meteor/reactive-var';
// import { Tracker } from 'meteor/tracker';
import { IMessage } from '../../../definition/IMessage';

export interface IOnUserStreamData {
	roomId: string;
	publicKey: string;
	userId: string;
	refresh?: boolean;
}

export interface IOTRRoom {
	// (userId: string, roomId: string): void;

	// _userId: string;
	// roomId: string;
	// peerId?: string;
	// established: ReactiveVar<boolean>;
	// establishing: ReactiveVar<boolean>;
	// declined: ReactiveVar<boolean>;

	// userOnlineComputation: Tracker.Computation | null;

	// keyPair: any;
	// exportedPublicKey: any;
	// sessionKey: any;

	handshake(refresh?: boolean): Promise<void>;
	acknowledge(): void;
	deny(): void;
	end(): void;
	reset(): void;
	generateKeyPair(): Promise<void>;
	importPublicKey(publicKey: any): Promise<void>;
	encryptText(data: Uint8Array): Promise<string>;
	encrypt(message: IMessage): Promise<string>;
	decrypt(message: string): Promise<string | EJSON>;
	onUserStream(type: string, data: IOnUserStreamData): Promise<void>;
}

export const userPresenceUsername = async (username: UserPresence['username']): Promise<string> => username as string;
