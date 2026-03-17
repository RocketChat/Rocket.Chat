import { Apps } from '@rocket.chat/apps';
import type { SlashCommand, SlashCommandPreviewItem } from '@rocket.chat/core-typings';
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

const commandsListResponseSchema = ajv.compile({
	type: 'object',
	properties: {
		commands: { type: 'array', items: { type: 'object' } },
		appsLoaded: { type: 'boolean' },
		offset: { type: 'number' },
		count: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['commands', 'appsLoaded', 'offset', 'count', 'total', 'success'],
	additionalProperties: false,
});

type CommandsRunBody = {
	command: string;
	roomId: string;
	params?: string | undefined;
	tmid?: string | undefined;
	triggerId?: string | undefined;
	msg?:
		| {
				_id: string;
				rid: string;
				msg: string;
				tmid?: string | undefined;
		  }
		| undefined;
};

const commandsRunBodySchema = ajv.compile<CommandsRunBody>({
	type: 'object',
	properties: {
		command: { type: 'string' },
		params: { type: 'string', nullable: true },
		roomId: { type: 'string' },
		tmid: { type: 'string', nullable: true },
		triggerId: { type: 'string', nullable: true },
		msg: { type: 'object', nullable: true },
	},
	required: ['command', 'roomId'],
	additionalProperties: false,
});

type CommandsPreviewGetQuery = {
	command: string;
	roomId: string;
	params?: string;
};

const commandsPreviewGetQuerySchema = ajv.compile<CommandsPreviewGetQuery>({
	type: 'object',
	properties: {
		command: { type: 'string' },
		params: { type: 'string', nullable: true },
		roomId: { type: 'string' },
	},
	required: ['command', 'roomId'],
	additionalProperties: false,
});

type CommandsPreviewPostBody = {
	command: string;
	roomId: string;
	params?: string;
	tmid?: string;
	triggerId?: string;
	previewItem: { id: string; type: string; value: unknown };
};

const commandsPreviewPostBodySchema = ajv.compile<CommandsPreviewPostBody>({
	type: 'object',
	properties: {
		command: { type: 'string' },
		params: { type: 'string', nullable: true },
		roomId: { type: 'string' },
		tmid: { type: 'string', nullable: true },
		triggerId: { type: 'string', nullable: true },
		previewItem: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				type: { type: 'string' },
				value: {},
			},
			required: ['id', 'type', 'value'],
		},
	},
	required: ['command', 'roomId', 'previewItem'],
	additionalProperties: false,
});

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
			response: {
				202: ajv.compile({
					type: 'object',
					properties: {
						success: { type: 'boolean', enum: [true] },
						commands: { type: 'array' },
						appsLoaded: { type: 'boolean', enum: [false] },
						offset: { type: 'number' },
						count: { type: 'number' },
						total: { type: 'number' },
					},
					required: ['success', 'commands', 'appsLoaded', 'offset', 'count', 'total'],
					additionalProperties: false,
				}),
				200: commandsListResponseSchema,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			if (!Apps.self?.isLoaded()) {
				return {
					statusCode: 202 as const,
					body: {
						success: true as const,
						commands: [],
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
			body: commandsRunBodySchema,
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
				200: ajv.compile({
					type: 'object',
					properties: {
						result: {},
						success: { type: 'boolean', enum: [true] },
					},
					required: ['success'],
					additionalProperties: false,
				}),
			},
		},
		async function action() {
			const body = this.bodyParams;

			if (typeof body.command !== 'string') {
				return API.v1.failure('You must provide a command to run.');
			}

			if (body.params && typeof body.params !== 'string') {
				return API.v1.failure('The parameters for the command must be a single string.');
			}

			if (typeof body.roomId !== 'string') {
				return API.v1.failure("The room's id where to execute this command must be provided and be a string.");
			}

			if (body.tmid && typeof body.tmid !== 'string') {
				return API.v1.failure('The tmid parameter when provided must be a string.');
			}

			const cmd = body.command.toLowerCase();
			if (!slashCommands.commands[cmd]) {
				return API.v1.failure('The command provided does not exist (or is disabled).');
			}

			if (!(await canAccessRoomIdAsync(body.roomId, this.userId))) {
				return API.v1.forbidden('forbidden');
			}

			const params = body.params ?? '';
			if (typeof body.tmid === 'string') {
				const thread = await Messages.findOneById(body.tmid);
				if (thread?.rid !== body.roomId) {
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
			query: commandsPreviewGetQuerySchema,
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
				200: ajv.compile({
					type: 'object',
					properties: {
						preview: {},
						success: { type: 'boolean', enum: [true] },
					},
					required: ['preview', 'success'],
					additionalProperties: false,
				}),
			},
		},
		async function action() {
			const query = this.queryParams;

			if (typeof query.command !== 'string') {
				return API.v1.failure('You must provide a command to get the previews from.');
			}

			if (query.params && typeof query.params !== 'string') {
				return API.v1.failure('The parameters for the command must be a single string.');
			}

			if (typeof query.roomId !== 'string') {
				return API.v1.failure("The room's id where the previews are being displayed must be provided and be a string.");
			}

			const cmd = query.command.toLowerCase();
			if (!slashCommands.commands[cmd]) {
				return API.v1.failure('The command provided does not exist (or is disabled).');
			}

			if (!(await canAccessRoomIdAsync(query.roomId, this.userId))) {
				return API.v1.forbidden('forbidden');
			}

			const params = query.params ?? '';

			const preview = await getSlashCommandPreviews({
				cmd,
				params,
				msg: { rid: query.roomId },
				userId: this.userId,
			});

			return API.v1.success({ preview });
		},
	)
	.post(
		'commands.preview',
		{
			authRequired: true,
			body: commandsPreviewPostBodySchema,
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
				200: ajv.compile({
					type: 'object',
					properties: {
						success: { type: 'boolean', enum: [true] },
					},
					required: ['success'],
					additionalProperties: false,
				}),
			},
		},
		async function action() {
			const body = this.bodyParams;

			if (typeof body.command !== 'string') {
				return API.v1.failure('You must provide a command to run the preview item on.');
			}

			if (body.params && typeof body.params !== 'string') {
				return API.v1.failure('The parameters for the command must be a single string.');
			}

			if (typeof body.roomId !== 'string') {
				return API.v1.failure("The room's id where the preview is being executed in must be provided and be a string.");
			}

			if (typeof body.previewItem === 'undefined') {
				return API.v1.failure('The preview item being executed must be provided.');
			}

			if (!body.previewItem.id || !body.previewItem.type || typeof body.previewItem.value === 'undefined') {
				return API.v1.failure('The preview item being executed is in the wrong format.');
			}

			if (body.tmid && typeof body.tmid !== 'string') {
				return API.v1.failure('The tmid parameter when provided must be a string.');
			}

			if (body.triggerId && typeof body.triggerId !== 'string') {
				return API.v1.failure('The triggerId parameter when provided must be a string.');
			}

			const cmd = body.command.toLowerCase();
			if (!slashCommands.commands[cmd]) {
				return API.v1.failure('The command provided does not exist (or is disabled).');
			}

			if (!(await canAccessRoomIdAsync(body.roomId, this.userId))) {
				return API.v1.forbidden('forbidden');
			}

			const params = body.params ?? '';
			if (body.tmid) {
				const thread = await Messages.findOneById(body.tmid);
				if (thread?.rid !== body.roomId) {
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
				body.previewItem as SlashCommandPreviewItem,
				this.userId,
			);

			return API.v1.success();
		},
	);

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

export type CommandsEndpoints = ExtractRoutesFromAPI<typeof commandsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends CommandsEndpoints {}
}
