import type { IBaseEventContent } from '../AbstractMatrixEvent';
import { AbstractMatrixEvent } from '../AbstractMatrixEvent';
import { MatrixEventType } from '../MatrixEventType';

type MatrixSendMessageType = 'm.text' | 'm.emote' | 'm.notice' | 'm.image' | 'm.file' | 'm.audio' | 'm.location' | 'm.video' | string;

export enum MatrixEnumSendMessageType {
	TEXT = 'm.text',
	EMOTE = 'm.emote',
	NOTICE = 'm.notice',
	IMAGE = 'm.image',
	FILE = 'm.file',
	AUDIO = 'm.audio',
	LOCATION = 'm.location',
	VIDEO = 'm.video',
}

interface IMatrixContentInfo {
	mimetype: string;
	size: number;
	duration?: number;
}

type MatrixRelatesToRelType = 'm.replace';

export enum MatrixEnumRelatesToRelType {
	REPLACE = 'm.replace',
}

export interface IMatrixEventContentRoomMessageSent extends IBaseEventContent {
	'body': string;
	'msgtype': MatrixSendMessageType;
	'info'?: IMatrixContentInfo;
	'url'?: string;
	'format'?: string;
	'formatted_body'?: string;
	'geo_uri'?: string;
	'm.new_content'?: {
		body: string;
		msgtype: MatrixSendMessageType;
		format?: string;
		formatted_body?: string;
	};
	'm.relates_to'?: {
		'rel_type': MatrixRelatesToRelType;
		'event_id': string;
		'm.in_reply_to'?: {
			event_id: string;
		};
	};
}

export class MatrixEventRoomMessageSent extends AbstractMatrixEvent {
	public content: IMatrixEventContentRoomMessageSent;

	public type = MatrixEventType.ROOM_MESSAGE_SENT;
}
