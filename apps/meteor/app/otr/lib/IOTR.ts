import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { ReactiveVar } from 'meteor/reactive-var';

import { OtrRoomState } from './OtrRoomState';
import { UserPresence } from '../../../client/lib/presence';
import type { OTRRoom } from '../client/OTRRoom';

export interface IOnUserStreamData {
	roomId: IRoom['_id'];
	publicKey: string;
	userId: IUser['_id'];
	refresh?: boolean;
}

export interface IOTRDecrypt {
	ack: string | Uint8Array;
	text: string;
	ts: Date;
	userId: IUser['_id'];
	_id: string;
}

export interface IOTRRoom {
	peerId: IUser['_id'];
	isFirstOTR: boolean;
	state: ReactiveVar<OtrRoomState>;
	setState(nextState: OtrRoomState): void;
	handshake(refresh?: boolean): Promise<void>;
	acknowledge(): void;
	deny(): void;
	end(): void;
	reset(): void;
	generateKeyPair(): Promise<void>;
	importPublicKey(publicKey: string): Promise<void>;
	encryptText(data: string | Uint8Array): Promise<string>;
	encrypt(message: IMessage): Promise<string>;
	decrypt(message: string): Promise<IOTRDecrypt | string>;
	onUserStream(type: string, data: IOnUserStreamData): Promise<void>;
}

export interface IOTR {
	enabled: ReactiveVar<boolean>;
	instancesByRoomId: { [rid: IRoom['_id']]: OTRRoom };
	isEnabled(): boolean;
	getInstanceByRoomId(roomId: IRoom['_id']): OTRRoom | undefined;
}

export type publicKeyObject = ReturnType<<T extends U, U extends JsonWebKey>() => T>;

export interface IOTRAlgorithm extends EcKeyAlgorithm, EcdhKeyDeriveParams {}

export const userPresenceUsername = async (username: UserPresence['username']): Promise<string> => username as string;
