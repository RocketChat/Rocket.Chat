import { federationSDK } from '@rocket.chat/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

import { isAuthenticatedMiddleware } from '../middlewares/isAuthenticated';

const PublicRoomsQuerySchema = {
	type: 'object',
	properties: {
		include_all_networks: {
			type: 'boolean',
			description: 'Include all networks (ignored)',
		},
		limit: {
			type: 'number',
			description: 'Maximum number of rooms to return',
		},
	},
	required: ['include_all_networks', 'limit'],
};

const isPublicRoomsQueryProps = ajv.compile(PublicRoomsQuerySchema);

const RoomObjectSchema = {
	type: 'object',
	properties: {
		avatar_url: {
			type: 'string',
			description: 'Room avatar URL',
		},
		canonical_alias: {
			type: 'string',
			description: 'Room canonical alias',
			nullable: true,
		},
		guest_can_join: {
			type: 'boolean',
			description: 'Whether guests can join the room',
		},
		join_rule: {
			type: 'string',
			description: 'Room join rule',
		},
		name: {
			type: 'string',
			description: 'Room name',
		},
		num_joined_members: {
			type: 'number',
			description: 'Number of joined members',
			nullable: true,
		},
		room_id: {
			type: 'string',
			description: 'Room ID',
		},
		room_type: {
			type: 'string',
			description: 'Room type',
			nullable: true,
		},
		topic: {
			type: 'string',
			description: 'Room topic',
			nullable: true,
		},
		world_readable: {
			type: 'boolean',
			description: 'Whether the room is world readable',
		},
	},
	required: ['avatar_url', 'guest_can_join', 'join_rule', 'name', 'room_id', 'world_readable'],
};

const PublicRoomsResponseSchema = {
	type: 'object',
	properties: {
		chunk: {
			type: 'array',
			items: RoomObjectSchema,
			description: 'Array of public rooms',
		},
	},
	required: ['chunk'],
};

const isPublicRoomsResponseProps = ajv.compile(PublicRoomsResponseSchema);

const PublicRoomsPostBodySchema = {
	type: 'object',
	properties: {
		include_all_networks: {
			type: 'string',
			description: 'Include all networks (ignored)',
			nullable: true,
		},
		limit: {
			type: 'number',
			description: 'Maximum number of rooms to return',
			nullable: true,
		},
		filter: {
			type: 'object',
			properties: {
				generic_search_term: {
					type: 'string',
					description: 'Generic search term for filtering rooms',
					nullable: true,
				},
				room_types: {
					type: 'array',
					items: {
						type: ['string', 'null'],
					},
					description: 'Array of room types to filter by',
					nullable: true,
				},
			},
		},
	},
	required: ['filter'],
};

const isPublicRoomsPostBodyProps = ajv.compile(PublicRoomsPostBodySchema);

export const getMatrixRoomsRoutes = () => {
	return new Router('/federation')
		.use(isAuthenticatedMiddleware())
		.get(
			'/v1/publicRooms',
			{
				query: isPublicRoomsQueryProps,
				response: {
					200: isPublicRoomsResponseProps,
				},
				tags: ['Federation'],
				license: ['federation'],
			},
			async () => {
				const defaultObj = {
					join_rule: 'public',
					guest_can_join: false, // trying to reduce required endpoint hits
					world_readable: false, // ^^^
					avatar_url: '', // ?? don't have any yet
				};

				const publicRooms = await federationSDK.getAllPublicRoomIdsAndNames();

				return {
					body: {
						chunk: publicRooms.map((room) => ({
							...defaultObj,
							...room,
						})),
					},
					statusCode: 200,
				};
			},
		)
		.post(
			'/v1/publicRooms',
			{
				body: isPublicRoomsPostBodyProps,
				response: {
					200: isPublicRoomsResponseProps,
				},
				tags: ['Federation'],
				license: ['federation'],
			},
			async (c) => {
				const body = await c.req.json();

				const defaultObj = {
					join_rule: 'public',
					guest_can_join: false, // trying to reduce required endpoint hits
					world_readable: false, // ^^^
					avatar_url: '', // ?? don't have any yet
				};

				const { filter } = body;

				const publicRooms = await federationSDK.getAllPublicRoomIdsAndNames();

				return {
					body: {
						chunk: publicRooms
							.filter((r) => {
								if (filter.generic_search_term) {
									return r.name.toLowerCase().includes(filter.generic_search_term.toLowerCase());
								}

								// Today only one room type is supported (https://spec.matrix.org/v1.15/client-server-api/#types)
								// TODO: https://rocketchat.atlassian.net/browse/FDR-152 -> Implement logic to handle custom room types
								// if (filter.room_types) {
								// }

								return true;
							})
							.map((room) => ({
								...defaultObj,
								...room,
							})),
					},
					statusCode: 200,
				};
			},
		);
};
