import type { Emitter } from '@rocket.chat/emitter';

import type { CallContact } from './CallContact';
import type { CallEvents } from './CallEvents';
import type { CallRole } from './CallRole';
import type { CallService } from './CallService';
import type { CallState } from './CallState';

export interface IClientMediaCallData {
	callId: string;
	role: CallRole;
	service: CallService;

	state?: CallState;
	ignored?: boolean;

	contact?: CallContact;
}

export interface IClientMediaCall extends Required<IClientMediaCallData> {
	emitter: Emitter<CallEvents>;

	getRemoteMediaStream(): MediaStream;

	accept(): Promise<void>;
	reject(): Promise<void>;
	hangup(): Promise<void>;
}
