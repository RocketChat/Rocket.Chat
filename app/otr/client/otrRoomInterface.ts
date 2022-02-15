import { ReactiveVar } from "meteor/reactive-var";
import { Tracker } from 'meteor/tracker';
import { IMessage } from "../../../definition/IMessage";

export interface onUserStreamData {
    roomId: string;
    publicKey: string;
    userId: string;
    refresh?: boolean;

}

export interface OTRRoomI {
    // (userId: string, roomId: string): void;
    userId: string;
    roomId: string;
    peerId?: string;
    established: ReactiveVar<boolean>;
    establishing: ReactiveVar<boolean>;
    declined: ReactiveVar<boolean>;

    userOnlineComputation: Tracker.Computation | null;

    keyPair: any;
    exportedPublicKey: any;
    sessionKey: any;

    handshake(refresh?: boolean) : void;
    acknowledge() : void;
    deny() : void;
    end() : void;
    reset() : void;
    generateKeyPair() : any;
    importPublicKey(publicKey: any) : any;
    encryptText(data: Uint8Array) : any;
    encrypt(message: IMessage) : any;
    decrypt(message: string) : any;
    onUserStream(type: string, data: onUserStreamData) : void;
}
