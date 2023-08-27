import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { expect } from 'chai';

import {
	FederationRoomChangeJoinRulesDto,
	FederationRoomChangeMembershipDto,
	FederationRoomChangeNameDto,
	FederationRoomChangeTopicDto,
	FederationRoomCreateInputDto,
	FederationRoomEditExternalMessageDto,
	FederationRoomReceiveExternalMessageDto,
	FederationRoomRedactEventDto,
	FederationRoomRoomChangePowerLevelsEventDto,
} from '../../../../../../../../server/services/federation/application/room/input/RoomReceiverDto';
import { EVENT_ORIGIN } from '../../../../../../../../server/services/federation/domain/IFederationBridge';
import { MatrixRoomReceiverConverter } from '../../../../../../../../server/services/federation/infrastructure/matrix/converters/room/RoomReceiver';
import { MatrixEventType } from '../../../../../../../../server/services/federation/infrastructure/matrix/definitions/MatrixEventType';
import { MATRIX_POWER_LEVELS } from '../../../../../../../../server/services/federation/infrastructure/matrix/definitions/MatrixPowerLevels';
import { MatrixRoomJoinRules } from '../../../../../../../../server/services/federation/infrastructure/matrix/definitions/MatrixRoomJoinRules';
import { RoomMembershipChangedEventType } from '../../../../../../../../server/services/federation/infrastructure/matrix/definitions/events/RoomMembershipChanged';

describe('Federation - Infrastructure - Matrix - MatrixRoomReceiverConverter', () => {
	describe('#toRoomCreateDto()', () => {
		const event = {
			content: { was_internally_programatically_created: true, name: 'roomName', internalRoomId: 'internalRoomId' },
			event_id: 'eventId',
			room_id: '!roomId:matrix.org',
			sender: '@marcos.defendi:matrix.org',
		};

		it('should return an instance of FederationRoomCreateInputDto', () => {
			expect(MatrixRoomReceiverConverter.toRoomCreateDto({} as any)).to.be.instanceOf(FederationRoomCreateInputDto);
		});

		it('should return the basic room properties correctly (normalizedRoomId without any "!" and only the part before the ":") if any', () => {
			const result = MatrixRoomReceiverConverter.toRoomCreateDto({ room_id: event.room_id } as any);
			expect(result.externalRoomId).to.be.equal('!roomId:matrix.org');
			expect(result.normalizedRoomId).to.be.equal('roomId');
		});

		it('should return the external room name and room type when the room state is present on the event and it has the correct events', () => {
			const state = [
				{ type: MatrixEventType.ROOM_NAME_CHANGED, content: { name: event.content.name } },
				{ type: MatrixEventType.ROOM_JOIN_RULES_CHANGED, content: { join_rule: MatrixRoomJoinRules.JOIN } },
			];
			const result = MatrixRoomReceiverConverter.toRoomCreateDto({ unsigned: { invite_room_state: state } } as any);
			expect(result.externalRoomName).to.be.equal(event.content.name);
			expect(result.roomType).to.be.equal(RoomType.CHANNEL);
		});

		it('should convert to the expected (private) room type when the join rule is equal to INVITE', () => {
			const state = [
				{ type: MatrixEventType.ROOM_NAME_CHANGED, content: { name: event.content.name } },
				{ type: MatrixEventType.ROOM_JOIN_RULES_CHANGED, content: { join_rule: MatrixRoomJoinRules.INVITE } },
			];
			const result = MatrixRoomReceiverConverter.toRoomCreateDto({ unsigned: { invite_room_state: state } } as any);
			expect(result.externalRoomName).to.be.equal(event.content.name);
			expect(result.roomType).to.be.equal(RoomType.PRIVATE_GROUP);
		});

		it('should convert to the expected (channel) room type when the join rule is equal to JOIN', () => {
			const state = [{ type: MatrixEventType.ROOM_JOIN_RULES_CHANGED, content: { join_rule: MatrixRoomJoinRules.JOIN } }];
			const result = MatrixRoomReceiverConverter.toRoomCreateDto({ invite_room_state: state } as any);
			expect(result.roomType).to.be.equal(RoomType.CHANNEL);
		});

		it('should convert the inviter id to the a rc-format like (without any @ in it)', () => {
			const result = MatrixRoomReceiverConverter.toRoomCreateDto({ sender: event.sender } as any);
			expect(result.normalizedInviterId).to.be.equal('marcos.defendi:matrix.org');
		});

		it('should set wasInternallyProgramaticallyCreated accordingly to the event', () => {
			const result = MatrixRoomReceiverConverter.toRoomCreateDto({ content: event.content } as any);
			expect(result.wasInternallyProgramaticallyCreated).to.be.true;
		});

		it('should convert the event properly', () => {
			const result = MatrixRoomReceiverConverter.toRoomCreateDto(event as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalInviterId: '@marcos.defendi:matrix.org',
				normalizedInviterId: 'marcos.defendi:matrix.org',
				wasInternallyProgramaticallyCreated: true,
				externalRoomName: undefined,
				roomType: undefined,
				internalRoomId: 'internalRoomId',
			});
		});
	});

	describe('#toChangeRoomMembershipDto()', () => {
		const event = {
			content: { name: 'roomName' },
			event_id: 'eventId',
			room_id: '!roomId:matrix.org',
			sender: '@marcos.defendi:matrix.org',
			state_key: '@marcos.defendi2:matrix.org',
		};

		it('should return an instance of FederationRoomChangeMembershipDto', () => {
			expect(MatrixRoomReceiverConverter.toChangeRoomMembershipDto({} as any, 'domain')).to.be.instanceOf(
				FederationRoomChangeMembershipDto,
			);
		});

		it('should return the basic room properties correctly (normalizedRoomId without any "!" and only the part before the ":") if any', () => {
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto({ room_id: event.room_id } as any, 'domain');
			expect(result.externalRoomId).to.be.equal('!roomId:matrix.org');
			expect(result.normalizedRoomId).to.be.equal('roomId');
		});

		it('should return the external room name and room type when the room state is present on the event and it has the correct events', () => {
			const state = [
				{ type: MatrixEventType.ROOM_NAME_CHANGED, content: { name: event.content.name } },
				{ type: MatrixEventType.ROOM_JOIN_RULES_CHANGED, content: { join_rule: MatrixRoomJoinRules.JOIN } },
			];
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto({ unsigned: { invite_room_state: state } } as any, 'domain');
			expect(result.externalRoomName).to.be.equal(event.content.name);
			expect(result.roomType).to.be.equal(RoomType.CHANNEL);
		});

		it('should convert to the expected (private) room type when the join rule is equal to INVITE', () => {
			const state = [
				{ type: MatrixEventType.ROOM_NAME_CHANGED, content: { name: event.content.name } },
				{ type: MatrixEventType.ROOM_JOIN_RULES_CHANGED, content: { join_rule: MatrixRoomJoinRules.INVITE } },
			];
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto({ unsigned: { invite_room_state: state } } as any, 'domain');
			expect(result.externalRoomName).to.be.equal(event.content.name);
			expect(result.roomType).to.be.equal(RoomType.PRIVATE_GROUP);
		});

		it('should convert to the expected (channel) room type when the join rule is equal to JOIN', () => {
			const state = [{ type: MatrixEventType.ROOM_JOIN_RULES_CHANGED, content: { join_rule: MatrixRoomJoinRules.JOIN } }];
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto({ invite_room_state: state } as any, 'domain');
			expect(result.roomType).to.be.equal(RoomType.CHANNEL);
		});

		it('should convert to the expected (direct) room type when the join rule is equal to INVITE and its a direct message', () => {
			const state = [{ type: MatrixEventType.ROOM_JOIN_RULES_CHANGED, content: { join_rule: MatrixRoomJoinRules.INVITE } }];
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto(
				{
					invite_room_state: state,
					content: { is_direct: true },
				} as any,
				'domain',
			);
			expect(result.roomType).to.be.equal(RoomType.DIRECT_MESSAGE);
		});

		it('should convert the inviter id to the a rc-format like (without any @ in it)', () => {
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto({ sender: event.sender } as any, 'domain');
			expect(result.normalizedInviterId).to.be.equal('marcos.defendi:matrix.org');
		});

		it('should convert the invitee id to the a rc-format like (without any @ in it)', () => {
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto({ state_key: event.sender } as any, 'domain');
			expect(result.normalizedInviteeId).to.be.equal('marcos.defendi:matrix.org');
		});

		it('should convert the inviter id to the a rc-format username like (without any @ in it and just the part before the ":")', () => {
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto({ sender: event.sender } as any, 'domain');
			expect(result.inviterUsernameOnly).to.be.equal('marcos.defendi');
		});

		it('should convert the invitee id to the a rc-format username like (without any @ in it and just the part before the ":")', () => {
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto({ state_key: event.sender } as any, 'domain');
			expect(result.inviteeUsernameOnly).to.be.equal('marcos.defendi');
		});

		it('should set leave to true if its a LEAVE event', () => {
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto(
				{
					content: { membership: RoomMembershipChangedEventType.LEAVE },
				} as any,
				'domain',
			);
			expect(result.leave).to.be.true;
		});

		it('should set leave to false if its NOT a LEAVE event', () => {
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto(
				{
					content: { membership: RoomMembershipChangedEventType.JOIN },
				} as any,
				'domain',
			);
			expect(result.leave).to.be.false;
		});

		it('should set the event origin as REMOTE if the inviter is from a different home server', () => {
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto({ sender: 'a:matrix.org' } as any, 'domain');
			expect(result.eventOrigin).to.be.equal(EVENT_ORIGIN.REMOTE);
		});

		it('should set the event origin as LOCAL if the inviter is NOT from a different home server', () => {
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto({ sender: 'a:domain' } as any, 'domain');
			expect(result.eventOrigin).to.be.equal(EVENT_ORIGIN.LOCAL);
		});

		it('should return the user profile properties when the event contains those infos', () => {
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto(
				{ ...event, content: { avatar_url: 'avatarUrl', displayname: 'displayname', membership: 'join' } } as any,
				'domain',
			);
			expect(result.userProfile).to.be.eql({
				avatarUrl: 'avatarUrl',
				displayName: 'displayname',
			});
		});

		it('should add the allInviteesExternalIdsWhenDM as an empty array property when the event is a direct message but the event does not contain room histocial data', () => {
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto(
				{
					...event,
					content: {
						avatar_url: 'avatarUrl',
						displayname: 'displayname',
						membership: 'join',
						is_direct: true,
					},
				} as any,
				'domain',
			);
			expect(result.allInviteesExternalIdsWhenDM).to.be.eql([]);
		});

		it('should add the allInviteesExternalIdsWhenDM property when the event is a direct message and the event contains the room historical data inside of invite_room_state', () => {
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto(
				{
					...event,
					content: {
						avatar_url: 'avatarUrl',
						displayname: 'displayname',
						membership: 'join',
						is_direct: true,
					},
					invite_room_state: [
						{
							type: MatrixEventType.ROOM_CREATED,
							content: {
								inviteesExternalIds: ['@a:matrix.org'],
							},
						},
					],
				} as any,
				'domain',
			);
			expect(result.allInviteesExternalIdsWhenDM).to.be.eql([
				{
					externalInviteeId: '@a:matrix.org',
					normalizedInviteeId: 'a:matrix.org',
					inviteeUsernameOnly: 'a',
				},
			]);
		});

		it('should add the allInviteesExternalIdsWhenDM property when the event is a direct message and the event contains the room historical data inside of unsigned.invite_room_state', () => {
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto(
				{
					...event,
					content: {
						avatar_url: 'avatarUrl',
						displayname: 'displayname',
						membership: 'join',
						is_direct: true,
					},
					unsigned: {
						invite_room_state: [
							{
								type: MatrixEventType.ROOM_CREATED,
								content: {
									inviteesExternalIds: ['@a:matrix.org'],
								},
							},
						],
					},
				} as any,
				'domain',
			);
			expect(result.allInviteesExternalIdsWhenDM).to.be.eql([
				{
					externalInviteeId: '@a:matrix.org',
					normalizedInviteeId: 'a:matrix.org',
					inviteeUsernameOnly: 'a',
				},
			]);
		});

		it('should convert the event properly', () => {
			const result = MatrixRoomReceiverConverter.toChangeRoomMembershipDto(event as any, 'domain');
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalInviterId: '@marcos.defendi:matrix.org',
				normalizedInviterId: 'marcos.defendi:matrix.org',
				externalInviteeId: '@marcos.defendi2:matrix.org',
				normalizedInviteeId: 'marcos.defendi2:matrix.org',
				inviteeUsernameOnly: 'marcos.defendi2',
				inviterUsernameOnly: 'marcos.defendi',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				leave: false,
				externalRoomName: undefined,
				roomType: undefined,
				allInviteesExternalIdsWhenDM: [],
				userProfile: {
					avatarUrl: undefined,
					displayName: undefined,
				},
			});
		});
	});

	describe('#toSendRoomMessageDto()', () => {
		const event = {
			event_id: 'eventId',
			content: {
				'body': 'rawMessage',
				'formatted_body': 'externalFormattedText',
				'm.relates_to': { 'm.in_reply_to': { event_id: 'replyToEventId' } },
			},
			room_id: '!roomId:matrix.org',
			sender: '@marcos.defendi:matrix.org',
		};

		it('should return an instance of FederationRoomReceiveExternalMessageDto', () => {
			expect(MatrixRoomReceiverConverter.toSendRoomMessageDto(event as any)).to.be.instanceOf(FederationRoomReceiveExternalMessageDto);
		});

		it('should return the basic room properties correctly (normalizedRoomId without any "!" and only the part before the ":") if any', () => {
			const result = MatrixRoomReceiverConverter.toSendRoomMessageDto(event as any);
			expect(result.externalRoomId).to.be.equal('!roomId:matrix.org');
			expect(result.normalizedRoomId).to.be.equal('roomId');
		});

		it('should convert the sender id to the a rc-format like (without any @ in it)', () => {
			const result = MatrixRoomReceiverConverter.toSendRoomMessageDto(event as any);
			expect(result.normalizedSenderId).to.be.equal('marcos.defendi:matrix.org');
		});

		it('should convert the event properly', () => {
			const result = MatrixRoomReceiverConverter.toSendRoomMessageDto(event as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: '@marcos.defendi:matrix.org',
				normalizedSenderId: 'marcos.defendi:matrix.org',
				externalFormattedText: 'externalFormattedText',
				rawMessage: 'rawMessage',
				replyToEventId: 'replyToEventId',
				thread: undefined,
			});
		});

		it('should convert the event properly when it is a thread', () => {
			const result = MatrixRoomReceiverConverter.toSendRoomMessageDto({
				...event,
				content: {
					...event.content,
					'm.relates_to': {
						'event_id': 'relatesToEventId',
						'm.in_reply_to': { event_id: 'inReplyToEventId' },
						'rel_type': MatrixEventType.MESSAGE_ON_THREAD,
						'is_falling_back': true,
					},
				},
			} as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: '@marcos.defendi:matrix.org',
				normalizedSenderId: 'marcos.defendi:matrix.org',
				externalFormattedText: 'externalFormattedText',
				rawMessage: 'rawMessage',
				replyToEventId: undefined,
				thread: {
					rootEventId: 'relatesToEventId',
					replyToEventId: 'inReplyToEventId',
				},
			});
		});

		it('should convert the event properly when it is a thread and the message is being edited inside the thread', () => {
			const result = MatrixRoomReceiverConverter.toSendRoomMessageDto({
				...event,
				content: {
					...event.content,
					'm.relates_to': {
						'event_id': 'relatesToEventId',
						'm.in_reply_to': { event_id: 'inReplyToEventId' },
						'rel_type': MatrixEventType.MESSAGE_ON_THREAD,
						'is_falling_back': false,
					},
				},
			} as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: '@marcos.defendi:matrix.org',
				normalizedSenderId: 'marcos.defendi:matrix.org',
				externalFormattedText: 'externalFormattedText',
				rawMessage: 'rawMessage',
				replyToEventId: 'inReplyToEventId',
				thread: {
					rootEventId: 'relatesToEventId',
					replyToEventId: 'inReplyToEventId',
				},
			});
		});
	});
	describe('#toEditRoomMessageDto()', () => {
		const event = {
			event_id: 'eventId',
			content: {
				'body': 'msg',
				'm.relates_to': { event_id: 'editsEventId' },
				'm.new_content': { body: 'newRawMessage', formatted_body: 'newExternalFormattedText' },
			},
			room_id: '!roomId:matrix.org',
			sender: '@marcos.defendi:matrix.org',
		};

		it('should return an instance of FederationRoomEditExternalMessageDto', () => {
			expect(MatrixRoomReceiverConverter.toEditRoomMessageDto(event as any)).to.be.instanceOf(FederationRoomEditExternalMessageDto);
		});

		it('should return the basic room properties correctly (normalizedRoomId without any "!" and only the part before the ":") if any', () => {
			const result = MatrixRoomReceiverConverter.toEditRoomMessageDto(event as any);
			expect(result.externalRoomId).to.be.equal('!roomId:matrix.org');
			expect(result.normalizedRoomId).to.be.equal('roomId');
		});

		it('should convert the sender id to the a rc-format like (without any @ in it)', () => {
			const result = MatrixRoomReceiverConverter.toEditRoomMessageDto(event as any);
			expect(result.normalizedSenderId).to.be.equal('marcos.defendi:matrix.org');
		});

		it('should convert the event properly', () => {
			const result = MatrixRoomReceiverConverter.toEditRoomMessageDto(event as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: '@marcos.defendi:matrix.org',
				normalizedSenderId: 'marcos.defendi:matrix.org',
				newRawMessage: 'newRawMessage',
				newExternalFormattedText: 'newExternalFormattedText',
				editsEvent: 'editsEventId',
			});
		});
	});

	describe('#toRoomChangeJoinRulesDto()', () => {
		const event = {
			event_id: 'eventId',
			content: { join_rule: MatrixRoomJoinRules.JOIN },
			room_id: '!roomId:matrix.org',
			sender: '@marcos.defendi:matrix.org',
		};

		it('should return an instance of FederationRoomChangeJoinRulesDto', () => {
			expect(MatrixRoomReceiverConverter.toRoomChangeJoinRulesDto({} as any)).to.be.instanceOf(FederationRoomChangeJoinRulesDto);
		});

		it('should return the basic room properties correctly (normalizedRoomId without any "!" and only the part before the ":") if any', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangeJoinRulesDto({ room_id: event.room_id } as any);
			expect(result.externalRoomId).to.be.equal('!roomId:matrix.org');
			expect(result.normalizedRoomId).to.be.equal('roomId');
		});

		it('should convert to the expected (private) room type when the join rule is equal to INVITE', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangeJoinRulesDto({ content: { join_rule: MatrixRoomJoinRules.INVITE } } as any);
			expect(result.roomType).to.be.equal(RoomType.PRIVATE_GROUP);
		});

		it('should convert to the expected (channel) room type when the join rule is equal to JOIN', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangeJoinRulesDto({ content: { join_rule: MatrixRoomJoinRules.JOIN } } as any);
			expect(result.roomType).to.be.equal(RoomType.CHANNEL);
		});

		it('should convert the event properly', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangeJoinRulesDto(event as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				roomType: RoomType.CHANNEL,
			});
		});
	});

	describe('#toRoomChangeNameDto()', () => {
		const event = {
			event_id: 'eventId',
			content: { name: '@roomName' },
			room_id: '!roomId:matrix.org',
			sender: '@marcos.defendi:matrix.org',
		};

		it('should return an instance of toRoomChangeNameDto', () => {
			expect(MatrixRoomReceiverConverter.toRoomChangeNameDto({} as any)).to.be.instanceOf(FederationRoomChangeNameDto);
		});

		it('should return the basic room properties correctly (normalizedRoomId without any "!" and only the part before the ":") if any', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangeNameDto({ room_id: event.room_id } as any);
			expect(result.externalRoomId).to.be.equal('!roomId:matrix.org');
			expect(result.normalizedRoomId).to.be.equal('roomId');
		});

		it('should convert the roomName to a normalized version without starting with @', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangeNameDto({ content: event.content } as any);
			expect(result.normalizedRoomName).to.be.equal('roomName');
		});

		it('should convert the event properly', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangeNameDto(event as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				normalizedRoomName: 'roomName',
				externalSenderId: '@marcos.defendi:matrix.org',
			});
		});
	});

	describe('#toRoomChangeTopicDto()', () => {
		const event = {
			event_id: 'eventId',
			content: { topic: 'room topic' },
			room_id: '!roomId:matrix.org',
			sender: '@marcos.defendi:matrix.org',
		};

		it('should return an instance of FederationRoomChangeTopicDto', () => {
			expect(MatrixRoomReceiverConverter.toRoomChangeTopicDto({} as any)).to.be.instanceOf(FederationRoomChangeTopicDto);
		});

		it('should return the basic room properties correctly (normalizedRoomId without any "!" and only the part before the ":") if any', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangeTopicDto({ room_id: event.room_id } as any);
			expect(result.externalRoomId).to.be.equal('!roomId:matrix.org');
			expect(result.normalizedRoomId).to.be.equal('roomId');
		});

		it('should convert the event properly', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangeTopicDto(event as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				roomTopic: 'room topic',
				externalSenderId: '@marcos.defendi:matrix.org',
			});
		});
	});

	describe('#toSendRoomFileMessageDto()', () => {
		const event = {
			event_id: 'eventId',
			content: {
				'body': 'filename',
				'url': 'url',
				'info': { mimetype: 'mime', size: 12 },
				'm.relates_to': { 'm.in_reply_to': { event_id: 'replyToEventId' } },
			},
			room_id: '!roomId:matrix.org',
			sender: '@marcos.defendi:matrix.org',
		};

		it('should throw an error if the url is not present in the file event', () => {
			expect(() => MatrixRoomReceiverConverter.toSendRoomFileMessageDto({ content: {} } as any)).to.throw(
				Error,
				'Missing url in the file message',
			);
		});

		it('should throw an error if the mimetype is not present in the file event', () => {
			expect(() => MatrixRoomReceiverConverter.toSendRoomFileMessageDto({ content: { url: 'url' } } as any)).to.throw(
				Error,
				'Missing mimetype in the file message',
			);
		});

		it('should throw an error if the size is not present in the file event', () => {
			expect(() =>
				MatrixRoomReceiverConverter.toSendRoomFileMessageDto({ content: { url: 'url', info: { mimetype: 'mime' } } } as any),
			).to.throw(Error, 'Missing size in the file message');
		});

		it('should return the basic room properties correctly (normalizedRoomId without any "!" and only the part before the ":") if any', () => {
			const result = MatrixRoomReceiverConverter.toSendRoomFileMessageDto({ room_id: event.room_id, content: event.content } as any);
			expect(result.externalRoomId).to.be.equal('!roomId:matrix.org');
			expect(result.normalizedRoomId).to.be.equal('roomId');
		});

		it('should convert the event properly', () => {
			const result = MatrixRoomReceiverConverter.toSendRoomFileMessageDto(event as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: '@marcos.defendi:matrix.org',
				normalizedSenderId: 'marcos.defendi:matrix.org',
				messageBody: {
					filename: event.content.body,
					url: event.content.url,
					mimetype: event.content.info.mimetype,
					size: event.content.info.size,
					messageText: event.content.body,
				},
				replyToEventId: 'replyToEventId',
				thread: undefined,
			});
		});

		it('should convert the event properly when it is a thread', () => {
			const result = MatrixRoomReceiverConverter.toSendRoomFileMessageDto({
				...event,
				content: {
					...event.content,
					'm.relates_to': {
						'event_id': 'relatesToEventId',
						'm.in_reply_to': { event_id: 'inReplyToEventId' },
						'rel_type': MatrixEventType.MESSAGE_ON_THREAD,
						'is_falling_back': true,
					},
				},
			} as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: '@marcos.defendi:matrix.org',
				normalizedSenderId: 'marcos.defendi:matrix.org',
				messageBody: {
					filename: event.content.body,
					url: event.content.url,
					mimetype: event.content.info.mimetype,
					size: event.content.info.size,
					messageText: event.content.body,
				},
				replyToEventId: undefined,
				thread: {
					rootEventId: 'relatesToEventId',
					replyToEventId: 'inReplyToEventId',
				},
			});
		});

		it('should convert the event properly when it is a thread and the message is being edited inside the thread', () => {
			const result = MatrixRoomReceiverConverter.toSendRoomFileMessageDto({
				...event,
				content: {
					...event.content,
					'm.relates_to': {
						'event_id': 'relatesToEventId',
						'm.in_reply_to': { event_id: 'inReplyToEventId' },
						'rel_type': MatrixEventType.MESSAGE_ON_THREAD,
						'is_falling_back': false,
					},
				},
			} as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: '@marcos.defendi:matrix.org',
				normalizedSenderId: 'marcos.defendi:matrix.org',
				messageBody: {
					filename: event.content.body,
					url: event.content.url,
					mimetype: event.content.info.mimetype,
					size: event.content.info.size,
					messageText: event.content.body,
				},
				replyToEventId: 'inReplyToEventId',
				thread: {
					rootEventId: 'relatesToEventId',
					replyToEventId: 'inReplyToEventId',
				},
			});
		});
	});

	describe('#toRoomRedactEventDto()', () => {
		const event = {
			event_id: 'eventId',
			redacts: '$eventId',
			room_id: '!roomId:matrix.org',
			sender: '@marcos.defendi:matrix.org',
		};

		it('should return an instance of FederationRoomRedactEventDto', () => {
			expect(MatrixRoomReceiverConverter.toRoomRedactEventDto({} as any)).to.be.instanceOf(FederationRoomRedactEventDto);
		});

		it('should return the basic room properties correctly (normalizedRoomId without any "!" and only the part before the ":") if any', () => {
			const result = MatrixRoomReceiverConverter.toRoomRedactEventDto({ room_id: event.room_id } as any);
			expect(result.externalRoomId).to.be.equal('!roomId:matrix.org');
			expect(result.normalizedRoomId).to.be.equal('roomId');
		});

		it('should convert the event properly', () => {
			const result = MatrixRoomReceiverConverter.toRoomRedactEventDto(event as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				redactsEvent: '$eventId',
				externalSenderId: '@marcos.defendi:matrix.org',
			});
		});
	});

	describe('#toRoomChangePowerLevelsEventDto()', () => {
		it('should return an instance of FederationRoomRoomChangePowerLevelsEventDto', () => {
			expect(MatrixRoomReceiverConverter.toRoomChangePowerLevelsEventDto({} as any)).to.be.instanceOf(
				FederationRoomRoomChangePowerLevelsEventDto,
			);
		});

		it('should return the basic room properties correctly (normalizedRoomId without any "!" and only the part before the ":") if any', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangePowerLevelsEventDto({ room_id: '!roomId:matrix.org' } as any);
			expect(result.externalRoomId).to.be.equal('!roomId:matrix.org');
			expect(result.normalizedRoomId).to.be.equal('roomId');
		});

		it('should return the changes on roles when the user was demoted to a default role and its previous role was owner', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangePowerLevelsEventDto({
				room_id: '!roomId:matrix.org',
				event_id: 'eventId',
				sender: 'sender',
				content: {
					users: {},
				},
				prev_content: {
					users: {
						'@marcos.defendi:matrix.org': MATRIX_POWER_LEVELS.ADMIN,
					},
				},
			} as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: 'sender',
				roleChangesToApply: {
					'@marcos.defendi:matrix.org': [{ role: 'owner', action: 'remove' }],
				},
			});
		});

		it('should return the changes on roles when the user was demoted to a default role and its previous role was moderator', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangePowerLevelsEventDto({
				room_id: '!roomId:matrix.org',
				event_id: 'eventId',
				sender: 'sender',
				content: {
					users: {},
				},
				prev_content: {
					users: {
						'@marcos.defendi:matrix.org': MATRIX_POWER_LEVELS.MODERATOR,
					},
				},
			} as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: 'sender',
				roleChangesToApply: {
					'@marcos.defendi:matrix.org': [{ role: 'moderator', action: 'remove' }],
				},
			});
		});

		it('should return an empty object for changes when there is no changes at all', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangePowerLevelsEventDto({
				room_id: '!roomId:matrix.org',
				event_id: 'eventId',
				sender: 'sender',
				content: {
					users: {
						'@marcos.defendi:matrix.org': MATRIX_POWER_LEVELS.MODERATOR,
					},
				},
				prev_content: {
					users: {
						'@marcos.defendi:matrix.org': MATRIX_POWER_LEVELS.MODERATOR,
					},
				},
			} as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: 'sender',
				roleChangesToApply: {},
			});
		});

		it('should return the correct changes on roles when the user was downgraded to a lower role', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangePowerLevelsEventDto({
				room_id: '!roomId:matrix.org',
				event_id: 'eventId',
				sender: 'sender',
				content: {
					users: {
						'@marcos.defendi:matrix.org': MATRIX_POWER_LEVELS.MODERATOR,
					},
				},
				prev_content: {
					users: {
						'@marcos.defendi:matrix.org': MATRIX_POWER_LEVELS.ADMIN,
					},
				},
			} as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: 'sender',
				roleChangesToApply: {
					'@marcos.defendi:matrix.org': [
						{ role: 'owner', action: 'remove' },
						{ role: 'moderator', action: 'add' },
					],
				},
			});
		});

		it('should return the correct changes on roles when the user was promoted to owner', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangePowerLevelsEventDto({
				room_id: '!roomId:matrix.org',
				event_id: 'eventId',
				sender: 'sender',
				content: {
					users: {
						'@marcos.defendi:matrix.org': MATRIX_POWER_LEVELS.ADMIN,
					},
				},
				prev_content: {
					users: {
						'@marcos.defendi:matrix.org': MATRIX_POWER_LEVELS.MODERATOR,
					},
				},
			} as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: 'sender',
				roleChangesToApply: {
					'@marcos.defendi:matrix.org': [
						{ role: 'owner', action: 'add' },
						{ role: 'moderator', action: 'remove' },
					],
				},
			});
		});

		it('should return the correct changes on roles when the user was promoted to moderator', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangePowerLevelsEventDto({
				room_id: '!roomId:matrix.org',
				event_id: 'eventId',
				sender: 'sender',
				content: {
					users: {
						'@marcos.defendi:matrix.org': MATRIX_POWER_LEVELS.MODERATOR,
					},
				},
				prev_content: {
					users: {
						'@marcos.defendi:matrix.org': MATRIX_POWER_LEVELS.USER,
					},
				},
			} as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: 'sender',
				roleChangesToApply: {
					'@marcos.defendi:matrix.org': [{ role: 'moderator', action: 'add' }],
				},
			});
		});

		it('should return the correct changes on roles when the user was a default user and now is an owner', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangePowerLevelsEventDto({
				room_id: '!roomId:matrix.org',
				event_id: 'eventId',
				sender: 'sender',
				content: {
					users: {
						'@marcos.defendi:matrix.org': MATRIX_POWER_LEVELS.ADMIN,
					},
				},
				prev_content: {
					users: {},
				},
			} as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: 'sender',
				roleChangesToApply: {
					'@marcos.defendi:matrix.org': [{ role: 'owner', action: 'add' }],
				},
			});
		});

		it('should return the correct changes on roles when the user was a default user and now is a moderator', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangePowerLevelsEventDto({
				room_id: '!roomId:matrix.org',
				event_id: 'eventId',
				sender: 'sender',
				content: {
					users: {
						'@marcos.defendi:matrix.org': MATRIX_POWER_LEVELS.MODERATOR,
					},
				},
				prev_content: {
					users: {},
				},
			} as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: 'sender',
				roleChangesToApply: {
					'@marcos.defendi:matrix.org': [{ role: 'moderator', action: 'add' }],
				},
			});
		});

		it('should return the correct changes on roles when the user has a custom role ending up with a DEFAULT(<= 0) role', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangePowerLevelsEventDto({
				room_id: '!roomId:matrix.org',
				event_id: 'eventId',
				sender: 'sender',
				content: {
					users: {
						'@marcos.defendi:matrix.org': -1,
					},
				},
				prev_content: {
					users: {
						'@marcos.defendi:matrix.org': MATRIX_POWER_LEVELS.MODERATOR,
					},
				},
			} as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: 'sender',
				roleChangesToApply: {
					'@marcos.defendi:matrix.org': [{ role: 'moderator', action: 'remove' }],
				},
			});
		});

		it('should return the correct changes on roles when the user has a custom role ending up with a MODERATOR(> 0 && <= 50) role', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangePowerLevelsEventDto({
				room_id: '!roomId:matrix.org',
				event_id: 'eventId',
				sender: 'sender',
				content: {
					users: {
						'@marcos.defendi:matrix.org': 18,
					},
				},
				prev_content: {
					users: {
						'@marcos.defendi:matrix.org': MATRIX_POWER_LEVELS.ADMIN,
					},
				},
			} as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: 'sender',
				roleChangesToApply: {
					'@marcos.defendi:matrix.org': [
						{ role: 'owner', action: 'remove' },
						{ role: 'moderator', action: 'add' },
					],
				},
			});
		});

		it('should return the correct changes on roles when the user has a custom role ending up with a OWNER(> 50) role', () => {
			const result = MatrixRoomReceiverConverter.toRoomChangePowerLevelsEventDto({
				room_id: '!roomId:matrix.org',
				event_id: 'eventId',
				sender: 'sender',
				content: {
					users: {
						'@marcos.defendi:matrix.org': 72,
					},
				},
				prev_content: {
					users: {
						'@marcos.defendi:matrix.org': MATRIX_POWER_LEVELS.MODERATOR,
					},
				},
			} as any);
			expect(result).to.be.eql({
				externalEventId: 'eventId',
				externalRoomId: '!roomId:matrix.org',
				normalizedRoomId: 'roomId',
				externalSenderId: 'sender',
				roleChangesToApply: {
					'@marcos.defendi:matrix.org': [
						{ role: 'owner', action: 'add' },
						{ role: 'moderator', action: 'remove' },
					],
				},
			});
		});
	});
});
