import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';
import * as z from 'zod';

import { createUploadsCodec } from '../../../../../../app/apps/server/converters/codecs/uploads';

const sandbox = sinon.createSandbox();

const converters = {
	rooms: { convertById: sandbox.stub() },
	users: { convertById: sandbox.stub() },
	visitors: { convertByToken: sandbox.stub() },
};

const orch = {
	getConverters: () => ({ get: (key: 'rooms' | 'users' | 'visitors') => (converters as any)[key] }),
} as unknown as IAppServerOrchestrator;

const codec = createUploadsCodec(orch);

describe('createUploadsCodec', () => {
	beforeEach(() => {
		sandbox.reset();
		converters.rooms.convertById.resolves({ id: 'room-1' });
		converters.users.convertById.resolves({ id: 'user-1' });
		converters.visitors.convertByToken.resolves({ id: 'visitor-1' });
	});

	it('leaves the user out and does not query for one when the upload has no uploader', async () => {
		const result: any = await z.decodeAsync(codec, { _id: 'up-1', name: 'a.txt', rid: 'room-1' } as any);

		expect(result).to.not.have.property('user');
		expect(converters.users.convertById.called).to.be.false;
	});

	it('leaves the visitor out and does not query for one when the upload has no visitor token', async () => {
		const result: any = await z.decodeAsync(codec, { _id: 'up-1', name: 'a.txt', rid: 'room-1' } as any);

		expect(result).to.not.have.property('visitor');
		expect(converters.visitors.convertByToken.called).to.be.false;
	});

	it('resolves the visitor from the token the upload carries', async () => {
		const result: any = await z.decodeAsync(codec, { _id: 'up-1', name: 'a.txt', rid: 'room-1', visitorToken: 'tok-1' } as any);

		expect(converters.visitors.convertByToken.firstCall.args[0]).to.equal('tok-1');
		expect(result.visitor).to.deep.equal({ id: 'visitor-1' });
	});
});
