import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../tests/mocks/moduleScope';

let Aes: typeof import('./crypto/aes');
let E2ERoom: (typeof import('./rocketchat.e2e.room'))['E2ERoom'];
let sdk: (typeof import('../SDKClient'))['sdk'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
const spyOn: ModuleMocker['spyOn'] = mocker.spyOn.bind(mocker);

class FakeResponse {
	constructor(
		private readonly body: unknown,
		public readonly status = 400,
	) {}

	clone() {
		return this;
	}

	async json() {
		return this.body;
	}
}
(global as any).Response = FakeResponse;

const makeRoom = () => new E2ERoom('user-1', { _id: 'room-1', t: 'p', encrypted: true } as any);

describe('E2ERoom.createGroupKey', () => {
	before(() => {
		enterModuleScope();
		mock.module('./crypto/aes', { exports: { importKey: fn(), exportJwk: fn(), generate: fn(), decrypt: fn(), encrypt: fn() } });
		mock.module('../../../client/lib/SDKClient', {
			exports: {
				sdk: { rest: { post: fn<FunctionLike>() } },
			},
		});
		mock.module('../../../app/utils/rocketchat.info', {
			exports: {
				Info: { version: '8.7.0' },
			},
		});
		Aes = require('./crypto/aes');
		({ E2ERoom } = require('./rocketchat.e2e.room'));
		({ sdk } = require('../SDKClient'));
	});

	after(leaveModuleScope);
	beforeEach(() => {
		mocker.clearAllMocks();
		(Aes.generate as Mock<FunctionLike>).mockResolvedValue('group-key');
		(Aes.exportJwk as Mock<FunctionLike>).mockResolvedValue({ k: 'jwk' });
	});

	afterEach(() => {
		mocker.restoreAllMocks();
	});

	it('should discard the local key and not distribute it when it loses the race', async () => {
		(sdk.rest.post as Mock<FunctionLike>).mockRejectedValueOnce(
			new (global as any).Response({ success: false, errorType: 'error-room-e2e-key-already-exists' }),
		);

		const e2eRoom = makeRoom();
		const result = await e2eRoom.createGroupKey();

		expect(result).toBe(false);
		expect(e2eRoom.groupSessionKey).toBeNull();
		expect(e2eRoom.keyID).toBeUndefined();
		expect(sdk.rest.post).toHaveBeenCalledTimes(1); // only setRoomKeyID was called
		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/e2e.setRoomKeyID', { rid: e2eRoom.roomId, keyID: expect.any(String) });
	});

	it('should return true and distribute the key when it wins the race', async () => {
		(sdk.rest.post as Mock<FunctionLike>).mockResolvedValue({});
		spyOn(E2ERoom.prototype as any, 'encryptGroupKeyForParticipant').mockResolvedValue('mykey');
		const encryptForOthersSpy = spyOn(E2ERoom.prototype as any, 'encryptKeyForOtherParticipants').mockResolvedValue(undefined);

		const e2eRoom = makeRoom();
		const result = await e2eRoom.createGroupKey();

		expect(result).toBe(true);
		expect(e2eRoom.groupSessionKey).not.toBeNull();

		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/e2e.setRoomKeyID', {
			rid: e2eRoom.roomId,
			keyID: expect.any(String),
		});
		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/e2e.updateGroupKey', {
			rid: e2eRoom.roomId,
			uid: e2eRoom.userId,
			key: 'mykey',
		});

		expect(encryptForOthersSpy).toHaveBeenCalledTimes(1);
		expect(sdk.rest.post).toHaveBeenCalledTimes(2); // both setRoomKeyID and updateGroupKey are called
	});
});
