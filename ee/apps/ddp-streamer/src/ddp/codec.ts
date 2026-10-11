import { MeteorError, isMeteorError } from '@rocket.chat/core-services';
import ejson from 'ejson';
import WebSocket from 'ws';

import type { IPacket } from './IPacket';
import { DDP_EVENTS } from './constants';

export const SERVER_ID = ejson.stringify({ msg: 'server_id', server_id: '0' });

export const SOCKJS_OPEN_FRAME = 'o';

const serialize = ejson.stringify;

/** Decodes an incoming DDP message, unwrapping the SockJS array envelope when present. */
export function decode(data: WebSocket.Data, isBinary: boolean): IPacket {
	if (isBinary) {
		throw new MeteorError(500, 'Binary data not supported');
	}
	const packet = data.toString();

	const payload = packet.startsWith('[') ? JSON.parse(packet)[0] : packet;
	return ejson.parse(payload);
}

const serializeError = (error: Error | MeteorError): object => (isMeteorError(error) ? error.toJSON() : error);

export const encodeConnected = (session: string): string => serialize({ [DDP_EVENTS.MSG]: DDP_EVENTS.CONNECTED, session });

export const encodePing = (id?: string): string => serialize({ [DDP_EVENTS.MSG]: DDP_EVENTS.PING, ...(id && { [DDP_EVENTS.ID]: id }) });

export const encodePong = (id?: string): string => serialize({ [DDP_EVENTS.MSG]: DDP_EVENTS.PONG, ...(id && { [DDP_EVENTS.ID]: id }) });

export const encodeResult = (id: string, result?: any, error?: Error | MeteorError): string =>
	serialize({
		[DDP_EVENTS.MSG]: DDP_EVENTS.RESULT,
		id,
		...(result && { result }),
		...(error && { error: serializeError(error) }),
	});

export const encodeUpdated = (id: string): string => serialize({ [DDP_EVENTS.MSG]: DDP_EVENTS.UPDATED, [DDP_EVENTS.METHODS]: [id] });

export const encodeNosub = (id: string, error?: Error | MeteorError): string =>
	serialize({
		[DDP_EVENTS.MSG]: DDP_EVENTS.NO_SUBSCRIBE,
		id,
		...(error && { error: serializeError(error) }),
	});

export const encodeReady = (id: string): string => serialize({ [DDP_EVENTS.MSG]: DDP_EVENTS.READY, [DDP_EVENTS.SUBSCRIPTIONS]: [id] });

export const encodeAdded = (collection: string, id: string, fields: any): string =>
	serialize({
		[DDP_EVENTS.MSG]: DDP_EVENTS.ADDED,
		[DDP_EVENTS.COLLECTION]: collection,
		[DDP_EVENTS.ID]: id,
		[DDP_EVENTS.FIELDS]: fields,
	});

export const encodeChanged = (collection: string, id: string, fields: any): string =>
	serialize({
		[DDP_EVENTS.MSG]: DDP_EVENTS.CHANGED,
		[DDP_EVENTS.COLLECTION]: collection,
		[DDP_EVENTS.ID]: id,
		[DDP_EVENTS.FIELDS]: fields,
	});

export const encodeRemoved = (collection: string, id: string): string =>
	serialize({
		[DDP_EVENTS.MSG]: DDP_EVENTS.REMOVED,
		[DDP_EVENTS.COLLECTION]: collection,
		[DDP_EVENTS.ID]: id,
	});

export const wrapForSockJs = (payload: string): string => `a${JSON.stringify([payload])}`;

const TEXT_FRAME_OPTIONS = {
	fin: true,
	rsv1: false,
	opcode: 1,
	mask: false,
	readOnly: false,
};

export type FanOutFrames = { sockjs: Buffer[]; raw: Buffer[] };

/** Frames a payload once per transport so a fan-out writes ready-made frames instead of encoding per subscriber. */
export function preframe(payload: string): FanOutFrames {
	return {
		sockjs: [Buffer.concat(WebSocket.Sender.frame(Buffer.from(wrapForSockJs(payload)), TEXT_FRAME_OPTIONS))],
		raw: [Buffer.concat(WebSocket.Sender.frame(Buffer.from(payload), TEXT_FRAME_OPTIONS))],
	};
}
