import mock from 'mock-require';
import { expect } from 'chai';

import { AppServerOrchestratorMock } from './mocks/orchestrator.mock';
import { appMessageMock, appMessageInvalidRoomMock } from './mocks/data/messages.data';
import { MessagesMock } from './mocks/models/Messages.mock';
import { RoomsMock } from './mocks/models/Rooms.mock';
import { UsersMock } from './mocks/models/Users.mock';

mock('../../../../../app/models', './mocks/models');
mock('meteor/random', {
	id: () => 1,
});

const { AppMessagesConverter } = require('../../../../../app/apps/server/converters/messages');

describe('The AppMessagesConverter instance', function () {
	let messagesConverter;
	let messagesMock;

	before(function () {
		const orchestrator = new AppServerOrchestratorMock();

		const usersConverter = orchestrator.getConverters().get('users');

		usersConverter.convertById = function convertUserByIdStub(id) {
			return UsersMock.convertedData[id];
		};

		usersConverter.convertToApp = function convertUserToAppStub(user) {
			return {
				id: user._id,
				username: user.username,
				name: user.name,
			};
		};

		orchestrator.getConverters().get('rooms').convertById = function convertRoomByIdStub(id) {
			return RoomsMock.convertedData[id];
		};

		messagesConverter = new AppMessagesConverter(orchestrator);
		messagesMock = new MessagesMock();
	});

	const createdAt = new Date('2019-03-30T01:22:08.389Z');
	const updatedAt = new Date('2019-03-30T01:22:08.412Z');

	describe('when converting a message from Rocket.Chat to the Engine schema', function () {
		it('should return `undefined` when `msgObj` is falsy', function () {
			const appMessage = messagesConverter.convertMessage(undefined);

			expect(appMessage).to.be.undefined;
		});

		it('should return a proper schema', function () {
			const appMessage = messagesConverter.convertMessage(messagesMock.findOneById('SimpleMessageMock'));

			expect(appMessage).to.have.property('id', 'SimpleMessageMock');
			expect(appMessage).to.have.property('createdAt').which.equalTime(createdAt);
			expect(appMessage).to.have.property('updatedAt').which.equalTime(updatedAt);
			expect(appMessage).to.have.property('groupable', false);
			expect(appMessage).to.have.property('sender').which.includes({ id: 'rocket.cat' });
			expect(appMessage).to.have.property('room').which.includes({ id: 'GENERAL' });

			expect(appMessage).not.to.have.property('editor');
			expect(appMessage).not.to.have.property('attachments');
			expect(appMessage).not.to.have.property('reactions');
			expect(appMessage).not.to.have.property('avatarUrl');
			expect(appMessage).not.to.have.property('alias');
			expect(appMessage).not.to.have.property('customFields');
			expect(appMessage).not.to.have.property('emoji');
		});

		it('should not mutate the original message object', function () {
			const rocketchatMessageMock = messagesMock.findOneById('SimpleMessageMock');

			messagesConverter.convertMessage(rocketchatMessageMock);

			expect(rocketchatMessageMock).to.deep.equal({
				_id: 'SimpleMessageMock',
				t: 'uj',
				rid: 'GENERAL',
				ts: new Date('2019-03-30T01:22:08.389Z'),
				msg: 'rocket.cat',
				u: {
					_id: 'rocket.cat',
					username: 'rocket.cat',
				},
				groupable: false,
				_updatedAt: new Date('2019-03-30T01:22:08.412Z'),
			});
		});

		it('should add an `_unmappedProperties_` field to the converted message which contains the `t` property of the message', function () {
			const appMessage = messagesConverter.convertMessage(messagesMock.findOneById('SimpleMessageMock'));

			expect(appMessage).to.have.property('_unmappedProperties_').which.has.property('t', 'uj');
		});

		it("should return basic sender info when it's not a Rocket.Chat user (e.g. Livechat Guest)", function () {
			const appMessage = messagesConverter.convertMessage(messagesMock.findOneById('LivechatGuestMessageMock'));

			expect(appMessage).to.have.property('sender').which.includes({
				id: 'guest1234',
				username: 'guest1234',
				name: 'Livechat Guest',
			});
		});
	});

	describe('when converting a message from the Engine schema back to Rocket.Chat', function () {
		it('should return `undefined` when `message` is falsy', function () {
			const rocketchatMessage = messagesConverter.convertAppMessage(undefined);

			expect(rocketchatMessage).to.be.undefined;
		});

		it('should return a proper schema', function () {
			const rocketchatMessage = messagesConverter.convertAppMessage(appMessageMock);

			expect(rocketchatMessage).to.have.property('_id', 'appMessageMock');
			expect(rocketchatMessage).to.have.property('rid', 'GENERAL');
			expect(rocketchatMessage).to.have.property('groupable', false);
			expect(rocketchatMessage).to.have.property('ts').which.equalTime(createdAt);
			expect(rocketchatMessage).to.have.property('_updatedAt').which.equalTime(updatedAt);
			expect(rocketchatMessage).to.have.property('u').which.includes({
				_id: 'rocket.cat',
				username: 'rocket.cat',
				name: 'Rocket.Cat',
			});
		});

		it('should merge `_unmappedProperties_` into the returned message', function () {
			const rocketchatMessage = messagesConverter.convertAppMessage(appMessageMock);

			expect(rocketchatMessage).not.to.have.property('_unmappedProperties_');
			expect(rocketchatMessage).to.have.property('t', 'uj');
		});

		it('should throw if message has an invalid room', function () {
			expect(() => messagesConverter.convertAppMessage(appMessageInvalidRoomMock)).to.throw(Error, 'Invalid room provided on the message.');
		});
	});
});
