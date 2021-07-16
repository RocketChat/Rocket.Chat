import { Emitter } from '@rocket.chat/emitter';
import { Box, Button } from '@rocket.chat/fuselage';
import React, { FC, useCallback } from 'react';
import { useSubscription } from 'use-subscription';

import { useUserRoom } from '../../../client/contexts/UserContext';

type State = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'notStarted' | 'error';

type Meta = {
	state: 'connecting' | 'connected';
	rid: string;
} | {
	state: 'disconnected' | 'disconnecting' | 'notStarted' | 'error';
}

const isMeta = (meta: Meta): meta is {
	state: 'connecting' | 'connected';
	rid: string;
} => ['connected', 'connecting'].includes(meta.state);

export class VoiceRoomManager extends Emitter<{
	'click': undefined;
	'change': State;
}> {
	public metadata: Meta ={
		state: 'notStarted',
	}

	private timeout?: NodeJS.Timeout;

	constructor() {
		super();
	}

	public setState(state: State, rid?: string): void {
		if (['connected', 'connecting'].includes(state)) {
			if (rid) {
				this.metadata = {
					state,
					rid,
				};
			}
			this.emit('change', state);
			return;
		}
		this.metadata = { state } as Meta;
		this.emit('change', state);
	}

	public connect(rid: string): void {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
		this.setState('connecting', rid);
		this.timeout = setTimeout(() => {
			this.setState('connected', rid);
		}, 1000);
	}

	public disconnect(): void {
		if (this.metadata.state === 'disconnecting') {
			return;
		}

		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}

		this.timeout = setTimeout(() => {
			this.setState('disconnected');
		}, 1000);

		this.setState('disconnecting');
	}
}
const v = new VoiceRoomManager();

const query = {
	getCurrentValue: (): Meta => v.metadata,
	subscribe: (callback: () => void): (() => void) => {
		const stop = v.on('change', callback);
		return () => {
			console.log('stopped');
			stop();
		};
	},
};

export const useVoiceChannelMeta = (): Meta => {
	const voiceManagerState = useSubscription(query);
	return voiceManagerState;
};

export const SideBarVoiceChannel: FC = () => {
	const meta = useVoiceChannelMeta();

	console.log(meta);

	if (!isMeta(meta)) {
		return null;
	}

	return <SideBarVoiceChannelRoom rid={meta.rid} meta={meta}/>;
};

export const SideBarVoiceChannelRoom: FC<{ rid: string; meta: Meta }> = ({ rid, meta }) => {
	const room = useUserRoom(rid);

	const fn = useCallback(() => {
		v.disconnect();
	}, []);

	if (!room) {
		return null;
	}


	return <Button onClick={fn}>{JSON.stringify(room.name || room.fname)} {meta.state}</Button>;
};


export const VoiceChannelButton: FC = () => {
	const meta = useVoiceChannelMeta();

	const fn = useCallback(() => {
		if (['notStarted', 'disconnected'].includes(meta.state)) {
			return v.connect('GENERAL');
		}
		v.disconnect();
	}, [meta]);

	return <Button onClick={fn}>Here {meta.state}</Button>;
};
