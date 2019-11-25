import { IEDataGenesis } from './data/IEDataGenesis';
import { IEDataMessage } from './data/IEDataMessage';
import { IEDataUpdate } from './data/IEDataUpdate';

export type EDataDefinition = IEDataUpdate<EDataDefinition> | IEDataGenesis | IEDataMessage;

export enum EventTypeDescriptor {
    // Global
    PING = 'ping',

    // Rooms
    GENESIS = 'genesis',
    MESSAGE = 'msg',
    EDIT_MESSAGE = 'emsg',

    // Not implemented
    DELETE = 'delete',
    ADD_USER = 'add_user',
    REMOVE_USER = 'remove_user',
    DELETE_MESSAGE = 'delete_message',
    SET_MESSAGE_REACTION = 'set_message_reaction',
    UNSET_MESSAGE_REACTION = 'unset_message_reaction',
    MUTE_USER = 'mute_user',
    UNMUTE_USER = 'unmute_user',
}

export interface IEvent<T extends EDataDefinition> {
    _id: string;
    _cid: string;
    _pids: Array<string>;
    v: number;
    ts: Date;
    src: string;
    rid: string;
    t: EventTypeDescriptor;
    d: T | IEDataUpdate<T>;
    hasChildren: boolean;
}
