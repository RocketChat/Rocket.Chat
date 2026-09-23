import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { createService, resetAll } from './testHarness';

/** Bytes the stubbed `crypto` hands out, in order; it pads with zeroes once they run out. */
let byteQueue: number[] = [];

const getRandomValues = (buffer: Uint8Array): Uint8Array => {
	for (let i = 0; i < buffer.length; i++) {
		buffer[i] = byteQueue.length ? (byteQueue.shift() as number) : 0;
	}
	return buffer;
};

const cryptoStub = { getRandomValues };

const setSipAliasById = sinon.stub().resolves();
const settingValues: Record<string, unknown> = {};

const VideoConfService = createService({
	models: { VideoConference: { setSipAliasById } },
	overrides: {
		'crypto': { ...cryptoStub, 'default': cryptoStub, '@noCallThru': true },
		'../../settings': { settings: { get: (key: string) => settingValues[key] } },
	},
});

const duplicateKeyError = () => new Error('E11000 duplicate key error collection: rocketchat_video_conference');

describe('VideoConfService SIP alias', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		resetAll(setSipAliasById);
		// History alone is not enough: `onFirstCall` and friends survive it, so a queued rejection from the
		// previous test would still be in force here.
		setSipAliasById.resetBehavior();
		setSipAliasById.resolves();
		byteQueue = [];
		settingValues.Pexip_Integration_SIP_AddAlias = true;
	});

	describe('makeSipAlias', () => {
		it('should produce eight digits that never start with a zero', () => {
			for (let i = 0; i < 200; i++) {
				byteQueue = [];
				expect(service.makeSipAlias()).to.match(/^[1-9][0-9]{7}$/);
			}
		});

		/**
		 * 256 divides by neither 9 nor 10, so folding every byte in with `%` would make the low digits likelier
		 * than the high ones. The bound is what stops that, and a byte above it has to be discarded rather than
		 * used — this pins both bounds at once.
		 */
		it('should discard bytes above the bound rather than folding them in', () => {
			// 252 rejected for the leading digit, 5 accepted as (5 % 9) + 1; 250 rejected for the next, 3 taken
			// as itself; the rest pad out as zeroes.
			byteQueue = [252, 5, 250, 3];

			expect(service.makeSipAlias()).to.equal('63000000');
		});

		it('should never yield a leading zero even when the byte would fold to one', () => {
			// 0 is below the bound and accepted, but the leading digit is `(value % 9) + 1`, so it lands on 1.
			byteQueue = [0];

			expect(service.makeSipAlias()[0]).to.equal('1');
		});
	});

	describe('addSipAlias', () => {
		it('should hand back the alias it stored', async () => {
			const alias = await service.addSipAlias('call1');

			expect(alias).to.match(/^[1-9][0-9]{7}$/);
			expect(setSipAliasById.calledOnceWith('call1', alias)).to.be.true;
		});

		// The index is unique, so a taken number comes back as a write error — retrying is the whole of the
		// collision handling.
		it('should try another number when the one it picked is taken', async () => {
			setSipAliasById.onFirstCall().rejects(duplicateKeyError());

			const alias = await service.addSipAlias('call1');

			expect(setSipAliasById.callCount).to.equal(2);
			expect(alias).to.match(/^[1-9][0-9]{7}$/);
		});

		it('should give up after twenty collisions rather than retrying forever', async () => {
			setSipAliasById.rejects(duplicateKeyError());

			const alias = await service.addSipAlias('call1');

			expect(alias).to.be.null;
			expect(setSipAliasById.callCount).to.equal(21);
		});

		// Anything that is not a collision says nothing about the number, so picking a different one is no
		// answer to it.
		it('should not retry an error that is not a collision', async () => {
			setSipAliasById.rejects(new Error('connection lost'));

			const alias = await service.addSipAlias('call1');

			expect(alias).to.be.null;
			expect(setSipAliasById.callCount).to.equal(1);
		});
	});

	describe('maybeAddSipAliasToCall', () => {
		it('should give an alias to an internal Pexip call', async () => {
			await service.maybeAddSipAliasToCall('call1', 'core.pexip');

			expect(setSipAliasById.calledOnce).to.be.true;
		});

		// Only the internal Pexip provider can be dialled into; an alias on anything else addresses nothing.
		it('should skip any other provider', async () => {
			await service.maybeAddSipAliasToCall('call1', 'jitsi');

			expect(setSipAliasById.called).to.be.false;
		});

		it('should skip when the workspace has not asked for aliases', async () => {
			settingValues.Pexip_Integration_SIP_AddAlias = false;

			await service.maybeAddSipAliasToCall('call1', 'core.pexip');

			expect(setSipAliasById.called).to.be.false;
		});
	});
});
