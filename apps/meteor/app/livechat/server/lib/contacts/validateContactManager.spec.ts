import { expect } from 'chai';
import { beforeEach, describe, it, vi } from 'vitest';

const { modelsMock, sandbox } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	const sandbox = sinon.createSandbox();
	return {
		sandbox,
		modelsMock: {
			Users: {
				findOneAgentById: sandbox.stub(),
			},
		},
	};
});

vi.mock('@rocket.chat/models', () => ({ Users: modelsMock.Users }));

const { validateContactManager } = await import('./validateContactManager');

describe('validateContactManager', () => {
	beforeEach(() => {
		sandbox.reset();
	});

	it('should throw an error if the user does not exist', async () => {
		modelsMock.Users.findOneAgentById.resolves(undefined);
		await expect(validateContactManager('any_id')).to.be.rejectedWith('error-contact-manager-not-found');
	});

	it('should not throw an error if the user has the "livechat-agent" role', async () => {
		const user = { _id: 'userId' };
		modelsMock.Users.findOneAgentById.resolves(user);

		await expect(validateContactManager('userId')).to.not.be.rejected;
		expect(modelsMock.Users.findOneAgentById.getCall(0).firstArg).to.be.equal('userId');
	});
});
