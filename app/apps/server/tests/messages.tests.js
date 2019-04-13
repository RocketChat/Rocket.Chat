/* eslint-env mocha */
import 'babel-polyfill';
import mock from 'mock-require';
import chai from 'chai';

import { AppServerOrchestratorMock } from './mocks/orchestrator.mock';

chai.use(require('chai-datetime'));
const { expect } = chai;

mock('../../../models', './mocks/models');
mock('meteor/random', {
	id: () => 1,
});

const { AppMessagesConverter } = require('../converters/messages');

const userMock = {
	username: 'rocket.cat',
	emails: [{
		address: 'rocketcat@rocket.chat',
		verified: true,
	}],
	type: 'bot',
	isEnabled: true,
	name: 'Rocket.Cat',
	roles: ['bot'],
	status: 'online',
	statusConnection: 'online',
	utcOffset: 0,
	createdAt: new Date(),
	updatedAt: new Date(),
	lastLoginAt: undefined,
};

const roomMock = {
	displayName: 'Mocked Room',
	slugifiedName: 'mocked-room',
	type: 'c',
	creator: userMock,
};

describe('The AppMessagesConverter instance', function() {
	let messagesConverter;

	before(function() {
		const orchestrator = new AppServerOrchestratorMock();

		orchestrator.getConverters().get('users').convertById = function convertUserByIdStub(id) {
			return {
				id,
				...userMock,
			};
		};

		orchestrator.getConverters().get('rooms').convertById = function convertRoomByIdStub(id) {
			return {
				id,
				...roomMock,
			};
		};

		messagesConverter = new AppMessagesConverter(orchestrator);
	});

	const createdAt = new Date('2019-03-30T01:22:08.389Z');
	const updatedAt = new Date('2019-03-30T01:22:08.412Z');

	describe('when converting a message from Rocket.Chat to the Engine schema', function() {
		const rocketchatMessageMock = {
			_id : 'bojapwB2udErwrvCZ',
			t : 'uj',
			rid : 'GENERAL',
			ts : createdAt,
			msg : 'rocket.cat',
			u : {
				_id : 'rocket.cat',
				username : 'rocket.cat',
			},
			groupable : false,
			_updatedAt : updatedAt,
		};

		it('should return `undefined` when `msgObj` is falsy', function() {
			const appMessage = messagesConverter.convertMessage(undefined);

			expect(appMessage).to.be.undefined;
		});

		it('should return a proper schema', function() {
			const appMessage = messagesConverter.convertMessage(rocketchatMessageMock);

			expect(appMessage).to.have.property('id', 'bojapwB2udErwrvCZ');
			expect(appMessage).to.have.property('createdAt').which.equalTime(createdAt);
			expect(appMessage).to.have.property('updatedAt').which.equalTime(updatedAt);
			expect(appMessage).to.have.property('groupable', false);
			expect(appMessage).to.have.property('sender').which.includes({ id: 'rocket.cat' });
			expect(appMessage).to.have.property('room').which.includes({ id: 'GENERAL' });
		});

		it('should not mutate the original message object', function() {
			messagesConverter.convertMessage(rocketchatMessageMock);

			expect(rocketchatMessageMock).to.deep.equal({
				_id : 'bojapwB2udErwrvCZ',
				t : 'uj',
				rid : 'GENERAL',
				ts : createdAt,
				msg : 'rocket.cat',
				u : {
					_id : 'rocket.cat',
					username : 'rocket.cat',
				},
				groupable : false,
				_updatedAt : updatedAt,
			});
		});

		it('should add an `_unmappedProperties_` field to the converted message which contains the `t` property of the message', function() {
			const appMessage = messagesConverter.convertMessage(rocketchatMessageMock);

			expect(appMessage)
				.to.have.property('_unmappedProperties_')
				.which.has.property('t')
				.which.equal('uj');
		});
	});

	describe('when converting a message from the Engine schema back to Rocket.Chat', function() {
		const appMessageMock = {
			id: 'bojapwB2udErwrvCZ',
			text: 'rocket.cat',
			createdAt,
			updatedAt,
			groupable: false,
			room: {
				id: 'GENERAL',
				displayName: 'Mocked Room',
				slugifiedName: 'mocked-room',
				type: 'c',
				creator: {
					username: 'rocket.cat',
					emails: [
						{
							address: 'rocketcat@rocket.chat',
							verified: true,
						},
					],
					type: 'bot',
					isEnabled: true,
					name: 'Rocket.Cat',
					roles: [
						'bot',
					],
					status: 'online',
					statusConnection: 'online',
					utcOffset: 0,
					createdAt: '2019-04-13T01:33:14.191Z',
					updatedAt: '2019-04-13T01:33:14.191Z',
				},
			},
			sender: {
				id: 'rocket.cat',
				username: 'rocket.cat',
				emails: [
					{
						address: 'rocketcat@rocket.chat',
						verified: true,
					},
				],
				type: 'bot',
				isEnabled: true,
				name: 'Rocket.Cat',
				roles: [
					'bot',
				],
				status: 'online',
				statusConnection: 'online',
				utcOffset: 0,
				createdAt: '2019-04-13T01:33:14.191Z',
				updatedAt: '2019-04-13T01:33:14.191Z',
			},
			_unmappedProperties_: {
				t: 'uj',
			},
		};

		it('should return `undefined` when `message` is falsy', function() {
			const rocketchatMessage = messagesConverter.convertAppMessage(undefined);

			expect(rocketchatMessage).to.be.undefined;
		});

		it('should return a proper schema', function() {
			const rocketchatMessage = messagesConverter.convertAppMessage(appMessageMock);

			expect(rocketchatMessage).to.have.property('_id', 'bojapwB2udErwrvCZ');
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

		it('should merge `_unmappedProperties_` into the returned message', function() {
			const rocketchatMessage = messagesConverter.convertAppMessage(appMessageMock);

			expect(rocketchatMessage).not.to.have.property('_unmappedProperties_');
			expect(rocketchatMessage).to.have.property('t', 'uj');
		});
	});
});
