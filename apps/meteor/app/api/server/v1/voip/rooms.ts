import { LivechatVoip } from '@rocket.chat/core-services';
import type { IVoipRoom } from '@rocket.chat/core-typings';
import { VoipRoom, LivechatVisitors, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { isVoipRoomProps, isVoipRoomsProps, isVoipRoomCloseProps } from '@rocket.chat/rest-typings';

import { typedJsonParse } from '../../../../../lib/typedJSONParse';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { API } from '../../api';
import { getPaginationItems } from '../../helpers/getPaginationItems';

type DateParam = { start?: string; end?: string };
const parseDateParams = (date?: string): DateParam => {
	return date && typeof date === 'string' ? typedJsonParse<DateParam>(date) : {};
};
const validateDateParams = (property: string, date: DateParam = {}): DateParam => {
	if (date?.start && isNaN(Date.parse(date.start))) {
		throw new Error(`The "${property}.start" query parameter must be a valid date.`);
	}
	if (date?.end && isNaN(Date.parse(date.end))) {
		throw new Error(`The "${property}.end" query parameter must be a valid date.`);
	}
	return date;
};
const parseAndValidate = (property: string, date?: string): DateParam => {
	return validateDateParams(property, parseDateParams(date));
};

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

const isRoomSearchProps = (props: any): props is { rid: string; token: string } => {
	return 'rid' in props && 'token' in props;
};

const isRoomCreationProps = (props: any): props is { agentId: string; direction: IVoipRoom['direction'] } => {
	return 'agentId' in props && 'direction' in props;
};

API.v1.addRoute(
	'voip/room',
	{
		authRequired: true,
		rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 },
		permissionsRequired: ['inbound-voip-calls'],
		validateParams: isVoipRoomProps,
	},
	{
		async get() {
			const { token } = this.queryParams;
			let agentId: string | undefined = undefined;
			let direction: IVoipRoom['direction'] = 'inbound';
			let rid: string | undefined = undefined;

			if (isRoomCreationProps(this.queryParams)) {
				agentId = this.queryParams.agentId;
				direction = this.queryParams.direction;
			}

			if (isRoomSearchProps(this.queryParams)) {
				rid = this.queryParams.rid;
			}

			const guest = await LivechatVisitors.getVisitorByToken(token, {});
			if (!guest) {
				return API.v1.failure('invalid-token');
			}

			if (!rid) {
				const room = await VoipRoom.findOneOpenByVisitorToken(token, { projection: API.v1.defaultFieldsToExclude });
				if (room) {
					return API.v1.success({ room, newRoom: false });
				}
				if (!agentId) {
					return API.v1.failure('agent-not-found');
				}

				const agentObj = await Users.findOneAgentById(agentId, {
					projection: { username: 1 },
				});
				if (!agentObj?.username) {
					return API.v1.failure('agent-not-found');
				}

				const { username, _id } = agentObj;
				const agent = { agentId: _id, username };
				const rid = Random.id();

				return API.v1.success(
					await LivechatVoip.getNewRoom(guest, agent, rid, direction, {
						projection: API.v1.defaultFieldsToExclude,
					}),
				);
			}

			const room = await VoipRoom.findOneByIdAndVisitorToken(rid, token, { projection: API.v1.defaultFieldsToExclude });
			if (!room) {
				return API.v1.failure('invalid-room');
			}
			return API.v1.success({ room, newRoom: false });
		},
	},
);

API.v1.addRoute(
	'voip/rooms',
	{ authRequired: true, validateParams: isVoipRoomsProps },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);

			const { sort, fields } = await this.parseJsonQuery();
			const { agents, open, tags, queue, visitorId, direction, roomName } = this.queryParams;
			const { createdAt: createdAtParam, closedAt: closedAtParam } = this.queryParams;

			// Reusing same L room permissions for simplicity
			const hasAdminAccess = await hasPermissionAsync(this.userId, 'view-livechat-rooms');
			const hasAgentAccess =
				(await hasPermissionAsync(this.userId, 'view-l-room')) && agents?.includes(this.userId) && agents?.length === 1;
			if (!hasAdminAccess && !hasAgentAccess) {
				return API.v1.forbidden();
			}

			const createdAt = parseAndValidate('createdAt', createdAtParam);
			const closedAt = parseAndValidate('closedAt', closedAtParam);

			return API.v1.success(
				await LivechatVoip.findVoipRooms({
					agents,
					open: open === 'true',
					tags,
					queue,
					visitorId,
					createdAt,
					closedAt,
					direction,
					roomName,
					options: { sort, offset, count, fields },
				}),
			);
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
	{ authRequired: true, validateParams: isVoipRoomCloseProps, permissionsRequired: ['inbound-voip-calls'] },
	{
		async post() {
			const { rid, token, options } = this.bodyParams;

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
			const closeResult = await LivechatVoip.closeRoom(visitor, room, this.user, 'voip-call-wrapup', options);
			if (!closeResult) {
				return API.v1.failure();
			}
			return API.v1.success({ rid });
		},
	},
);
