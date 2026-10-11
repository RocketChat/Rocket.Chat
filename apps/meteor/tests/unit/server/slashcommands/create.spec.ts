import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { loadSlashCommand } from './helpers';

describe('/create', () => {
	const actor = { _id: 'actor', username: 'alice' };
	let findRoom: sinon.SinonStub;
	let findUser: sinon.SinonStub;
	let createChannel: sinon.SinonStub;
	let createPrivateGroup: sinon.SinonStub;
	let slashCommand: ReturnType<typeof loadSlashCommand>;

	beforeEach(() => {
		findRoom = sinon.stub().resolves(null);
		findUser = sinon.stub().resolves(actor);
		createChannel = sinon.stub().resolves();
		createPrivateGroup = sinon.stub().resolves();
		slashCommand = loadSlashCommand('create/server', {
			'@rocket.chat/models': { Rooms: { findOneByName: findRoom }, Users: { findOneById: findUser } },
			'../../meteor-methods/rooms/createChannel': { createChannelMethod: createChannel },
			'../../meteor-methods/rooms/createPrivateGroup': { createPrivateGroupMethod: createPrivateGroup },
		});

		slashCommand.settings.get.withArgs('UTF8_Channel_Names_Validation').returns('[a-zA-Z0-9-]+');
	});

	it('creates a public channel from the validated name', async () => {
		await slashCommand.runCommand('create', { params: '  #general  ' });
		sinon.assert.calledOnceWithExactly(findRoom, 'general');
		sinon.assert.calledOnceWithExactly(createChannel, 'actor', 'general', []);
		sinon.assert.notCalled(createPrivateGroup);
	});

	it('creates a private group with the authenticated user when --private is present', async () => {
		await slashCommand.runCommand('create', { params: '#general --other --private' });
		sinon.assert.calledOnceWithExactly(findUser, 'actor');
		sinon.assert.calledOnceWithExactly(createPrivateGroup, actor, 'general', []);
		sinon.assert.notCalled(createChannel);
	});

	it('uses the configured channel-name validation for non-ASCII names', async () => {
		slashCommand.settings.get.withArgs('UTF8_Channel_Names_Validation').returns('[áa-z]+');
		await slashCommand.runCommand('create', { params: '#olá' });
		sinon.assert.calledOnceWithExactly(createChannel, 'actor', 'olá', []);
	});

	['[a-z]+', '^'].forEach((pattern) => {
		it(`ignores invalid or empty matches using ${pattern}`, async () => {
			slashCommand.settings.get.withArgs('UTF8_Channel_Names_Validation').returns(pattern);
			await slashCommand.runCommand('create', { params: '###' });
			sinon.assert.notCalled(findRoom);
			sinon.assert.notCalled(createChannel);
			sinon.assert.notCalled(createPrivateGroup);
		});
	});

	it('reports a duplicate channel without creating either room type', async () => {
		findRoom.resolves({ _id: 'existing' });
		await slashCommand.runCommand('create', { params: '#general' });
		slashCommand.expectTranslatedFeedback('Channel_already_exist');
		expect(slashCommand.translate.firstCall.args[1]).to.include({ channelName: 'general', lng: 'en' });
		sinon.assert.notCalled(createChannel);
		sinon.assert.notCalled(createPrivateGroup);
	});

	it('does not create a private group for an unknown actor', async () => {
		findUser.resolves(null);
		await slashCommand.runCommand('create', { params: '#general --private' });
		sinon.assert.calledOnce(findUser);
		sinon.assert.notCalled(createChannel);
		sinon.assert.notCalled(createPrivateGroup);
	});

	it('propagates a creation permission failure without trying another room type', async () => {
		const error = new Error('Not authorized');
		createPrivateGroup.rejects(error);
		await expect(slashCommand.runCommand('create', { params: '#general --private' })).to.be.rejectedWith(error);
		sinon.assert.calledOnce(createPrivateGroup);
		sinon.assert.notCalled(createChannel);
	});
});
