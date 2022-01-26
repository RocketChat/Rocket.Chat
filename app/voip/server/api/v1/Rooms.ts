import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { API } from '../../../../api/server';
import { VoipRoom, LivechatVisitors } from '../../../../models/server/raw';
import { LivechatVoip } from '../../../../../server/sdk';
import { IVoipRoom, OmnichannelSourceType } from '../../../../../definition/IRoom';
/**
 * @openapi
 *  /voip/server/api/v1/voip/room <AMOL Verify during code review>
 *    get:
 *      description: Creates a new room if rid is not passed, else gets an existing room
 * 		based on rid and token
 *      security:
 *      parameters:
 *        - name: token
 *          in: query
 *          description: The visitor token
 *          required: true
 *          schema:
 *            type: string
 *          example: ByehQjC44FwMeiLbX
 *        - name: rid
 *          in: query
 *          description: The room id
 *          required: false
 *          schema:
 *            type: string
 *          example: ByehQjC44FwMeiLbX
 *        - name: agentId
 *          in: query
 *          description: Agent Id
 *          required: false
 *          schema:
 *            type: string
 *          example: ByehQjC44FwMeiLbX
 *      responses:
 *        200:
 *          description: Room object and flag indicating whether a new room is created.
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                  - $ref: '#/components/schemas/ApiSuccessV1'
 *                  - type: object
 *                    properties:
 *                      room:
 *                        type: object
 *                        items:
 *                          $ref: '#/components/schemas/IRoom'
 *                      newRoom:
 *                        type: boolean
 *        default:
 *          description: Unexpected error
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */
API.v1.addRoute('voip/room', {
	async get() {
		const defaultCheckParams = {
			token: String,
			rid: Match.Maybe(String),
			agentId: Match.Maybe(String),
		};
		check(this.queryParams, defaultCheckParams);

		const { token, rid, agentId } = this.queryParams;
		const guest = await LivechatVisitors.getVisitorByToken(token, {});
		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		let room;
		if (!rid) {
			room = await VoipRoom.findOneOpenByVisitorToken(token, { projection: API.v1.defaultFieldsToExclude });
			if (room) {
				return API.v1.success({ room, newRoom: false });
			}
			let agent;

			let agentObj = null;
			if (agentId) {
				agentObj = await LivechatVoip.findAgent(agentId);
			}
			if (agentObj) {
				const { username } = agentObj;
				agent = { agentId, username };
			}
			const rid = Random.id();
			const roomInfo = {
				source: {
					type: OmnichannelSourceType.API,
				},
			};
			room = await LivechatVoip.getNewRoom(guest, agent, rid, roomInfo, { projection: API.v1.defaultFieldsToExclude });
			return API.v1.success(room);
		}
		room = await VoipRoom.findOneOpenByRoomIdAndVisitorToken(rid, token, { projection: API.v1.defaultFieldsToExclude });
		if (!room) {
			throw new Meteor.Error('invalid-room');
		}
		return API.v1.success({ room, newRoom: false });
	},
});

/**
 * @openapi
 *  /voip/server/api/v1/voip/room.close <AMOL Verify during code review>
 *    post:
 *      description: Closes an open room
 * 		based on rid and token
 *      security:
 *		requestBody:
 *      required: true
 *      content:
 *			application/json:
 *          schema:
 *          	type: object
 *			  	properties:
 *					rid:
 *                 		type: string
 *					token:
 *						type: string
 *      responses:
 *        200:
 *          description: rid of closed room and a comment for closing room
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                  - $ref: '#/components/schemas/ApiSuccessV1'
 *                  - type: object
 *                    properties:
 *                      rid:
 *                        	type: string
 *                      comment:
 *                      	type: string
 *        default:
 *          description: Unexpected error
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */
API.v1.addRoute('voip/room.close', {
	async post() {
		try {
			check(this.bodyParams, {
				rid: String,
				token: String,
			});
			const { rid, token } = this.bodyParams;

			const visitor = await LivechatVisitors.getVisitorByToken(token, {});
			if (!visitor) {
				throw new Meteor.Error('invalid-token');
			}
			const roomResult = await LivechatVoip.findRoom(token, rid);
			if (!roomResult) {
				throw new Meteor.Error('invalid-room');
			}
			const room: IVoipRoom = roomResult;
			if (!room.open) {
				throw new Meteor.Error('room-closed');
			}
			const language = 'en';
			const comment = TAPi18n.__('Closed_by_visitor', { lng: language });
			const closeResult = await LivechatVoip.closeRoom(visitor, room, {});
			if (!closeResult) {
				return API.v1.failure();
			}
			return API.v1.success({ rid, comment });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
