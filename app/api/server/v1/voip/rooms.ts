import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings as rcSettings } from '../../../../settings/server';
import { API } from '../../api';
import { VoipRoom, LivechatVisitors, Users } from '../../../../models/server/raw';
import { LivechatVoip } from '../../../../../server/sdk';
import { ILivechatAgent } from '../../../../../definition/ILivechatAgent';

/**
 * @openapi
 *  /voip/server/api/v1/voip/room
 *    get:
 *      description: Creates a new room if rid is not passed, else gets an existing room
 * 		based on rid and token . This configures the rate limit. An average call volume in a contact
 * 		center is 600 calls a day
 * 		considering 8 hour shift. Which comes to 1.25 calls per minute.
 * 		we will keep the safe limit which is 5 calls a minute.
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

API.v1.addRoute(
	'voip/room',
	{ authRequired: false, rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 } },
	{
		async get() {
			const defaultCheckParams = {
				token: String,
				agentId: String,
				rid: Match.Maybe(String),
			};
			check(this.queryParams, defaultCheckParams);

			const { token, rid, agentId } = this.queryParams;
			const guest = await LivechatVisitors.getVisitorByToken(token, {});
			if (!guest) {
				return API.v1.failure('invalid-token');
			}

			if (!rid) {
				const room = await VoipRoom.findOneOpenByVisitorToken(token, { projection: API.v1.defaultFieldsToExclude });
				if (room) {
					return API.v1.success({ room, newRoom: false });
				}

				const agentObj: ILivechatAgent = await Users.findOneAgentById(agentId, {
					projection: { username: 1 },
				});
				if (!agentObj?.username) {
					return API.v1.failure('agent-not-found');
				}

				const { username } = agentObj;
				const agent = { agentId, username };
				const rid = Random.id();

				return API.v1.success(await LivechatVoip.getNewRoom(guest, agent, rid, { projection: API.v1.defaultFieldsToExclude }));
			}

			const room = await VoipRoom.findOneOpenByRoomIdAndVisitorToken(rid, token, { projection: API.v1.defaultFieldsToExclude });
			if (!room) {
				return API.v1.failure('invalid-room');
			}
			return API.v1.success({ room, newRoom: false });
		},
	},
);

/**
 * @openapi
 *  /voip/server/api/v1/voip/room.close
 *    post:
 *      description: Closes an open room
 * 		based on rid and token. Setting rate limit for this too
 * 		Because room creation happens 5/minute, rate limit for this api
 * 		is also set to 5/minute.
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
API.v1.addRoute(
	'voip/room.close',
	{ authRequired: false, rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 } },
	{
		async post() {
			check(this.bodyParams, {
				rid: String,
				token: String,
			});
			const { rid, token } = this.bodyParams;

			const visitor = await LivechatVisitors.getVisitorByToken(token, {});
			if (!visitor) {
				return API.v1.failure('invalid-token');
			}
			const room = await LivechatVoip.findRoom(token, rid);
			if (!room) {
				return API.v1.failure('invalid-room');
			}
			if (!room.open) {
				return API.v1.failure('room-closed');
			}
			const language: string = rcSettings.get('Language') || 'en';
			const comment = TAPi18n.__('Closed_by_visitor', { lng: language });
			const closeResult = await LivechatVoip.closeRoom(visitor, room);
			if (!closeResult) {
				return API.v1.failure();
			}
			return API.v1.success({ rid, comment });
		},
	},
);
