import type { JSONSchemaType } from 'ajv';

import { mediaSignalDeliverSchema } from './MediaSignalDeliver';
import type { MediaSignalDeliver } from './MediaSignalDeliver';
import { mediaSignalNotifySchema } from './MediaSignalNotify';
import type { MediaSignalNotify } from './MediaSignalNotify';
import { mediaSignalRequestSchema } from './MediaSignalRequest';
import type { MediaSignalRequest } from './MediaSignalRequest';

export type MediaSignalMap = {
	request: MediaSignalRequest;
	deliver: MediaSignalDeliver;
	notify: MediaSignalNotify;
};

export type MediaSignalType = keyof MediaSignalMap;

export type MediaSignal<T extends MediaSignalType = MediaSignalType> = MediaSignalMap[T];

export type ClientMediaSignal<T extends MediaSignal> = Omit<T, 'callId' | 'sessionId' | 'version' | 'sequence' | 'role'>;

export const mediaSignalSchema: JSONSchemaType<MediaSignal> = {
	type: 'object',
	oneOf: [mediaSignalRequestSchema, mediaSignalDeliverSchema, mediaSignalNotifySchema],
};

export type MediaSignalBody<T extends MediaSignalType = MediaSignalType> = MediaSignal<T>['body'];
