import { before, beforeEach, describe, it } from 'node:test';

import type { IRoomsModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const settingValues: Record<string, unknown> = {};
let reloadPolicy: () => Promise<void>;
let job: () => Promise<void>;

const cleanRoomHistoryMock = sinon.stub();

p.noCallThru().load('./cronPruneMessages.ts', {
	'../../../settings': {
		settings: {
			get: (id: string) => settingValues[id],
			watchMultiple: (_ids: string[], callback: () => Promise<void>) => {
				reloadPolicy = callback;
			},
		},
	},
	'@rocket.chat/cron': {
		cronJobs: {
			has: async () => false,
			remove: async () => undefined,
			add: async (_name: string, _precision: string, fn: () => Promise<void>) => {
				job = fn;
			},
		},
	},
	'../cleanRoomHistory': { cleanRoomHistory: cleanRoomHistoryMock },
});

const cursorOf = (docs: unknown[]) => ({ toArray: async () => docs });

describe('cronPruneMessages', () => {
	before(() => {
		registerModel('IRoomsModel', {
			find: (query: Record<string, any>) =>
				cursorOf(query['retention.overrideGlobal']?.$eq ? [{ _id: 'own-policy-room', retention: { maxAge: 1 } }] : [{ _id: 'room' }]),
		} as unknown as IRoomsModel);
	});

	beforeEach(async () => {
		cleanRoomHistoryMock.reset();
		cleanRoomHistoryMock.resolves(0);
		Object.assign(settingValues, {
			RetentionPolicy_Enabled: true,
			RetentionPolicy_AppliesToChannels: true,
		});
		await reloadPolicy();
	});

	it('keeps the messages discussions started from in every pruned room when "Delete original discussion messages" is off', async () => {
		settingValues.RetentionPolicy_DeleteDiscussionOrigin = false;

		await job();

		expect(
			cleanRoomHistoryMock.getCalls().map(({ args: [{ rid, ignoreDiscussionOrigin }] }) => [rid, ignoreDiscussionOrigin]),
		).to.deep.equal([
			['room', true],
			['own-policy-room', true],
		]);
	});

	it('lets the prune delete the messages discussions started from when "Delete original discussion messages" is on', async () => {
		settingValues.RetentionPolicy_DeleteDiscussionOrigin = true;

		await job();

		expect(
			cleanRoomHistoryMock.getCalls().map(({ args: [{ rid, ignoreDiscussionOrigin }] }) => [rid, ignoreDiscussionOrigin]),
		).to.deep.equal([
			['room', false],
			['own-policy-room', false],
		]);
	});
});
