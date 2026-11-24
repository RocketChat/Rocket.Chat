import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const createServiceIdIndex = sinon.stub();
const error = sinon.stub();

const { ensureServiceIdIndex } = p.noCallThru().load('./ensureServiceIdIndex.ts', {
	'@rocket.chat/models': { Users: { createServiceIdIndex } },
	'./logger': { logger: { error } },
});

describe('ensureServiceIdIndex', () => {
	beforeEach(() => {
		createServiceIdIndex.reset();
		error.resetHistory();
	});

	it('should create the index once per service', async () => {
		createServiceIdIndex.resolves('services.github.id_1');

		await ensureServiceIdIndex('github');
		await ensureServiceIdIndex('github');
		await ensureServiceIdIndex('gitlab');

		expect(createServiceIdIndex.args).to.deep.equal([['github'], ['gitlab']]);
	});

	it('should log a failure without throwing and try again the next time the service is configured', async () => {
		createServiceIdIndex.onFirstCall().rejects(new Error('E11000 duplicate key error'));
		createServiceIdIndex.onSecondCall().resolves('services.google.id_1');

		await ensureServiceIdIndex('google');
		await ensureServiceIdIndex('google');

		expect(error.calledOnce).to.be.true;
		expect(createServiceIdIndex.calledTwice).to.be.true;
	});
});
