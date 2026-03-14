import { Apps } from '@rocket.chat/apps';
import type { SlashCommand } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import {
	ajv,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';
import objectPath from 'object-path';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { executeSlashCommandPreview } from '../../../lib/server/methods/executeSlashCommandPreview';
import { getSlashCommandPreviews } from '../../../lib/server/methods/getSlashCommandPreviews';
import { slashCommands } from '../../../utils/server/slashCommand';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

type CommandsGetParams = { command: string };

const CommandsGetParamsSchema = {
	type: 'object',
	properties: {
		command: { type: 'string' },
	},
	required: ['command'],
	additionalProperties: false,
};

const isCommandsGetParams = ajv.compile<CommandsGetParams>(CommandsGetParamsSchema);

type CommandsListParams = {
	count?: number;
	offset?: number;
	sort?: string;
	query?: string;
	fields?: string;
};

const CommandsListParamsSchema = {
	type: 'object',
	properties: {
		count: { type: 'number', nullable: true },
		offset: { type: 'number', nullable: true },
		sort: { type: 'string', nullable: true },
		query: { type: 'string', nullable: true },
		fields: { type: 'string', nullable: true },
	},
	required: [],
	additionalProperties: false,
};

const isCommandsListParams = ajv.compile<CommandsListParams>(CommandsListParamsSchema);

type CommandsRunBody = {
	command: string;
	params?: string;
	roomId: string;
	tmid?: string;
	triggerId?: string;
};

const CommandsRunBodySchema = {
	type: 'object',
	properties: {
		command: { type: 'string' },
		params: { type: 'string', nullable: true },
		roomId: { type: 'string' },
		tmid: { type: 'string', nullable: true },
		triggerId: { type: 'string', nullable: true },
	},
	required: ['command', 'roomId'],
	additionalProperties: false,
};

const isCommandsRunBody = ajv.compile<CommandsRunBody>(CommandsRunBodySchema);

type CommandsPreviewQuery = {
	command: string;
	params?: string;
	roomId: string;
};

const CommandsPreviewQuerySchema = {
	type: 'object',
	properties: {
		command: { type: 'string' },
		params: { type: 'string', nullable: true },
		roomId: { type: 'string' },
	},
	required: ['command', 'roomId'],
	additionalProperties: false,
};

const isCommandsPreviewQuery = ajv.compile<CommandsPreviewQuery>(CommandsPreviewQuerySchema);

type CommandsPreviewBody = {
	command: string;
	params?: string;
	roomId: string;
	previewItem: {
		id: string;
		type: string;
		value: string;
	};
	triggerId?: string;
	tmid?: string;
};

const CommandsPreviewBodySchema = {
	type: 'object',
	properties: {
		command: { type: 'string' },
		params: { type: 'string', nullable: true },
		roomId: { type: 'string' },
		previewItem: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				type: { type: 'string' },
				value: { type: 'string' },
			},
			required: ['id', 'type', 'value'],
			additionalProperties: false,
		},
		triggerId: { type: 'string', nullable: true },
		tmid: { type: 'string', nullable: true },
	},
	required: ['command', 'roomId', 'previewItem'],
	additionalProperties: false,
};

const isCommandsPreviewBody = ajv.compile<CommandsPreviewBody>(CommandsPreviewBodySchema);

/* @deprecated */
const processQueryOptionsOnResult = <T extends { _id?: string } & Record<string, any>, F extends keyof T>(
	result: T[],
	options: {
		fields?: {
			[key in F]?: 1 | 0;
		};
		sort?: {
			[key: string]: 1 | -1;
		};
		limit?: number;
		skip?: number;
	} = {},
): Pick<T, F>[] => {
	if (result === undefined || result === null) {
		return [];
	}

	if (Array.isArray(result)) {
		if (options.sort) {
			result = result.sort((a, b) => {
				let r = 0;
				for (const field in options.sort) {
					if (options.sort.hasOwnProperty(field)) {
						const direction = options.sort[field];
						let valueA;
						let valueB;
						if (field.indexOf('.') > -1) {
							valueA = objectPath.get(a, field);
							valueB = objectPath.get(b, field);
						} else {
							valueA = a[field];
							valueB = b[field];
						}
						if (valueA > valueB) {
							r = direction;
							break;
						}
						if (valueA < valueB) {
							r = -direction;
							break;
						}
					}
				}
				return r;
			});
		}

		if (typeof options.skip === 'number') {
			result.splice(0, options.skip);
		}

		if (typeof options.limit === 'number' && options.limit !== 0) {
			result.splice(options.limit);
		}
	}

	const fieldsToRemove: F[] = [];
	const fieldsToGet: F[] = [];

	if (options.fields) {
		for (const field in Object.keys(options.fields)) {
			if (options.fields.hasOwnProperty(field as F)) {
				if (options.fields[field as F] === 0) {
					fieldsToRemove.push(field as F);
				} else if (options.fields[field as F] === 1) {
					fieldsToGet.push(field as F);
				}
			}
		}
	}

	if (fieldsToGet.length > 0 && fieldsToGet.indexOf('_id' as F) === -1) {
		fieldsToGet.push('_id' as F);
	}

	const pickFields = <F extends keyof T>(obj: T, fields: F[]): Pick<T, F> => {
		const picked: Partial<T> = {};
		fields.forEach((field: F) => {
			if (String(field).indexOf('.') !== -1) {
				objectPath.set(picked, String(field), objectPath.get(obj, String(field)));
			} else {
				picked[field] = obj[field];
			}
		});
		return picked as Pick<T, F>;
	};

	if (fieldsToRemove.length > 0 && fieldsToGet.length > 0) {
		console.warn("Can't mix remove and get fields");
		fieldsToRemove.splice(0, fieldsToRemove.length);
	}

	if (fieldsToRemove.length > 0 || fieldsToGet.length > 0) {
		return result.map((record) => {
			if (fieldsToRemove.length > 0) {
				return Object.fromEntries(Object.entries(record).filter(([key]) => !fieldsToRemove.includes(key as F))) as Pick<T, F>;
			}

			return pickFields(record, fieldsToGet);
		});
	}

	return result;
};

const commandsEndpoints = API.v1
	.get(
		'commands.get',
		{
			authRequired: true,
			query: isCommandsGetParams,
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				200: ajv.compile<{
					command: Pick<SlashCommand, 'clientOnly' | 'command' | 'description' | 'params' | 'providesPreview'>;
					success: true;
				}>({
					type: 'object',
					properties: {
						command: {
							type: 'object',
							properties: {
								clientOnly: { type: 'boolean' },
								command: { type: 'string' },
								description: { type: 'string' },
								params: { type: 'string' },
								providesPreview: { type: 'boolean' },
							},
							required: ['command', 'providesPreview'],
							additionalProperties: false,
						},
						success: {
							type: 'boolean',
							enum: [true],
						},
					},
					required: ['command', 'success'],
					additionalProperties: false,
				}),
			},
		},

		async function action() {
			const params = this.queryParams;

			const cmd = slashCommands.commands[params.command.toLowerCase()];

			if (!cmd) {
				return API.v1.failure(`There is no command in the system by the name of: ${params.command}`);
			}

			return API.v1.success({
				command: {
					command: cmd.command,
					description: cmd.description,
					params: cmd.params,
					clientOnly: cmd.clientOnly,
					providesPreview: cmd.providesPreview,
				},
			});
		},
	)
	.get(
		'commands.list',
		{
			authRequired: true,
			query: isCommandsListParams,
			response: {
				200: ajv.compile<{
					commands: object[];
					appsLoaded: boolean;
					offset: number;
					count: number;
					total: number;
					success: true;
				}>({
					type: 'object',
					properties: {
						commands: { type: 'array', items: { type: 'object', additionalProperties: true } },
						appsLoaded: { type: 'boolean' },
						offset: { type: 'number' },
						count: { type: 'number' },
						total: { type: 'number' },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['commands', 'appsLoaded', 'offset', 'count', 'total', 'success'],
					additionalProperties: false,
				}),
				202: ajv.compile<{
					commands: object[];
					appsLoaded: boolean;
					offset: number;
					count: number;
					total: number;
				}>({
					type: 'object',
					properties: {
						commands: { type: 'array', items: { type: 'object', additionalProperties: true } },
						appsLoaded: { type: 'boolean' },
						offset: { type: 'number' },
						count: { type: 'number' },
						total: { type: 'number' },
					},
					required: ['commands', 'appsLoaded', 'offset', 'count', 'total'],
					additionalProperties: false,
				}),
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			if (!Apps.self?.isLoaded()) {
				return {
					statusCode: 202 as const, // Accepted - apps are not ready, so the list is incomplete. Retry later
					body: {
						success: true as const,
						commands: [] as object[],
						appsLoaded: false,
						offset: 0,
						count: 0,
						total: 0,
					},
				};
			}

			const params = this.queryParams as Record<string, any>;
			const { offset, count } = await getPaginationItems(params);
			const { sort, query } = await this.parseJsonQuery();

			let commands = Object.values(slashCommands.commands);

			if (query?.command) {
				commands = commands.filter((command) => command.command === query.command);
			}

			const totalCount = commands.length;

			return API.v1.success({
				commands: processQueryOptionsOnResult(commands, {
					sort: sort || { name: 1 },
					skip: offset,
					limit: count,
				}),
				appsLoaded: true,
				offset,
				count: commands.length,
				total: totalCount,
			});
		},
	)
	.post(
		'commands.run',
		{
			authRequired: true,
			body: isCommandsRunBody,
			response: {
				200: ajv.compile<{ result: unknown; success: true }>({
					type: 'object',
					properties: {
						result: {},
						success: { type: 'boolean', enum: [true] },
					},
					required: ['success'],
					additionalProperties: true,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const body = this.bodyParams;

			const cmd = body.command.toLowerCase();
			if (!slashCommands.commands[cmd]) {
				return API.v1.failure('The command provided does not exist (or is disabled).');
			}

			if (!(await canAccessRoomIdAsync(body.roomId, this.userId))) {
				return API.v1.forbidden('User does not have access to this room');
			}

			const params = body.params ? body.params : '';
			if (typeof body.tmid === 'string') {
				const thread = await Messages.findOneById(body.tmid);
				if (!thread || thread.rid !== body.roomId) {
					return API.v1.failure('Invalid thread.');
				}
			}

			const message = {
				_id: Random.id(),
				rid: body.roomId,
				msg: `/${cmd} ${params}`,
				...(body.tmid && { tmid: body.tmid }),
			};

			const { triggerId } = body;

			const result = await slashCommands.run({ command: cmd, params, message, triggerId, userId: this.userId });

			return API.v1.success({ result });
		},
	)
	.get(
		'commands.preview',
		{
			authRequired: true,
			query: isCommandsPreviewQuery,
			response: {
				200: ajv.compile<{ preview: object; success: true }>({
					type: 'object',
					properties: {
						preview: { type: 'object', additionalProperties: true },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['preview', 'success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const query = this.queryParams;

			const cmd = query.command.toLowerCase();
			if (!slashCommands.commands[cmd]) {
				return API.v1.failure('The command provided does not exist (or is disabled).');
			}

			if (!(await canAccessRoomIdAsync(query.roomId, this.userId))) {
				return API.v1.forbidden('User does not have access to this room');
			}

			const params = query.params ? query.params : '';

			const preview = await getSlashCommandPreviews({
				cmd,
				params,
				msg: { rid: query.roomId },
				userId: this.userId,
			});

			return API.v1.success({ preview: preview ?? { i18nTitle: '', items: [] } });
		},
	)
	.post(
		'commands.preview',
		{
			authRequired: true,
			body: isCommandsPreviewBody,
			response: {
				200: ajv.compile<void>({
					type: 'object',
					properties: {
						success: { type: 'boolean', enum: [true] },
					},
					required: ['success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const body = this.bodyParams;

			const cmd = body.command.toLowerCase();
			if (!slashCommands.commands[cmd]) {
				return API.v1.failure('The command provided does not exist (or is disabled).');
			}

			if (!(await canAccessRoomIdAsync(body.roomId, this.userId))) {
				return API.v1.forbidden('User does not have access to this room');
			}

			const { params = '' } = body;
			if (body.tmid) {
				const thread = await Messages.findOneById(body.tmid);
				if (!thread || thread.rid !== body.roomId) {
					return API.v1.failure('Invalid thread.');
				}
			}

			const msg = {
				rid: body.roomId,
				...(body.tmid && { tmid: body.tmid }),
			};

			await executeSlashCommandPreview(
				{
					cmd,
					params,
					msg,
					triggerId: body.triggerId,
				},
				body.previewItem as import('@rocket.chat/core-typings').SlashCommandPreviewItem,
				this.userId,
			);

			return API.v1.success();
		},
	);

export type CommandsEndpoints = ExtractRoutesFromAPI<typeof commandsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends CommandsEndpoints {}
}
