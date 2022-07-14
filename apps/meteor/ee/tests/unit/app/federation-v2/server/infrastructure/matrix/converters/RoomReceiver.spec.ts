/* eslint-disable @typescript-eslint/camelcase */
import { expect } from 'chai';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { MatrixRoomReceiverConverterEE } from '../../../../../../../../app/federation-v2/server/infrastructure/matrix/converters/RoomReceiver';
import {
	FederationRoomChangeJoinRulesDto,
	FederationRoomChangeNameDto,
	FederationRoomChangeTopicDto,
} from '../../../../../../../../app/federation-v2/server/application/input/RoomReceiverDto';
import { RoomJoinRules } from '../../../../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/RoomJoinRules';

describe('FederationEE - Infrastructure - Matrix - MatrixRoomReceiverConverterEE', () => {
	describe('#toRoomChangeJoinRulesDto()', () => {
		const event = {
			content: { join_rule: RoomJoinRules.JOIN },
			room_id: '!roomId:matrix.org',
			sender: '@marcos.defendi:matrix.org',
		};

		it('should return an instance of FederationRoomChangeJoinRulesDto', () => {
			expect(MatrixRoomReceiverConverterEE.toRoomChangeJoinRulesDto({} as any)).to.be.instanceOf(FederationRoomChangeJoinRulesDto);
		});

		it('should return the basic room properties correctly (normalizedRoomId without any "!" and only the part before the ":") if any', () => {
			const result = MatrixRoomReceiverConverterEE.toRoomChangeJoinRulesDto({ room_id: event.room_id } as any);
			expect(result.externalRoomId).to.be.equal('!roomId:matrix.org');
			expect(result.normalizedRoomId).to.be.equal('roomId');
		});

		it('should convert to the expected (private) room type when the join rule is equal to INVITE', () => {
			const result = MatrixRoomReceiverConverterEE.toRoomChangeJoinRulesDto({ content: { join_rule: RoomJoinRules.INVITE } } as any);
			expect(result.roomType).to.be.equal(RoomType.PRIVATE_GROUP);
		});

		it('should convert to the expected (channel) room type when the join rule is equal to JOIN', () => {
			const result = MatrixRoomReceiverConverterEE.toRoomChangeJoinRulesDto({ content: { join_rule: RoomJoinRules.JOIN } } as any);
			expect(result.roomType).to.be.equal(RoomType.CHANNEL);
		});

		it('should convert the event properly', () => {
			const result = MatrixRoomReceiverConverterEE.toRoomChangeJoinRulesDto(event as any);
			expect(result).to.be.eql({
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				roomType: RoomType.CHANNEL,
			});
		});
	});

	describe('#toRoomChangeNameDto()', () => {
		const event = {
			content: { name: '@roomName' },
			room_id: '!roomId:matrix.org',
			sender: '@marcos.defendi:matrix.org',
		};

		it('should return an instance of toRoomChangeNameDto', () => {
			expect(MatrixRoomReceiverConverterEE.toRoomChangeNameDto({} as any)).to.be.instanceOf(FederationRoomChangeNameDto);
		});

		it('should return the basic room properties correctly (normalizedRoomId without any "!" and only the part before the ":") if any', () => {
			const result = MatrixRoomReceiverConverterEE.toRoomChangeNameDto({ room_id: event.room_id } as any);
			expect(result.externalRoomId).to.be.equal('!roomId:matrix.org');
			expect(result.normalizedRoomId).to.be.equal('roomId');
		});

		it('should convert the roomName to a normalized version without starting with @', () => {
			const result = MatrixRoomReceiverConverterEE.toRoomChangeNameDto({ content: event.content } as any);
			expect(result.normalizedRoomName).to.be.equal('roomName');
		});

		it('should convert the event properly', () => {
			const result = MatrixRoomReceiverConverterEE.toRoomChangeNameDto(event as any);
			expect(result).to.be.eql({
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				normalizedRoomName: 'roomName',
			});
		});
	});

	describe('#toRoomChangeTopicDto()', () => {
		const event = {
			content: { topic: 'room topic' },
			room_id: '!roomId:matrix.org',
			sender: '@marcos.defendi:matrix.org',
		};

		it('should return an instance of FederationRoomChangeTopicDto', () => {
			expect(MatrixRoomReceiverConverterEE.toRoomChangeTopicDto({} as any)).to.be.instanceOf(FederationRoomChangeTopicDto);
		});

		it('should return the basic room properties correctly (normalizedRoomId without any "!" and only the part before the ":") if any', () => {
			const result = MatrixRoomReceiverConverterEE.toRoomChangeTopicDto({ room_id: event.room_id } as any);
			expect(result.externalRoomId).to.be.equal('!roomId:matrix.org');
			expect(result.normalizedRoomId).to.be.equal('roomId');
		});

		it('should convert the event properly', () => {
			const result = MatrixRoomReceiverConverterEE.toRoomChangeTopicDto(event as any);
			expect(result).to.be.eql({
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				roomTopic: 'room topic',
			});
		});
	});
});
