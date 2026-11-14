import { describe, it } from 'node:test';

import type { MessageTypesValues } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { expandSystemMessageOptions } from './expandSystemMessageOptions';

describe('expandSystemMessageOptions', () => {
	it('should expand mute_unmute into user-muted and user-unmuted', () => {
		expect([...expandSystemMessageOptions(['mute_unmute'])]).to.deep.equal(['user-muted', 'user-unmuted']);
	});

	it('should keep other message types as they are', () => {
		expect([...expandSystemMessageOptions(['room-archived', 'room_changed_description'])]).to.deep.equal([
			'room-archived',
			'room_changed_description',
		]);
	});

	it('should remove duplicates', () => {
		expect([...expandSystemMessageOptions(['user-muted', 'mute_unmute', 'room-archived', 'room-archived'])]).to.deep.equal([
			'user-muted',
			'user-unmuted',
			'room-archived',
		]);
	});

	it('should not treat object prototype keys as grouped options', () => {
		expect([...expandSystemMessageOptions(['toString'] as unknown as MessageTypesValues[])]).to.deep.equal(['toString']);
	});
});
