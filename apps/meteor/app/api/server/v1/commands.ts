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

const commandsEndpoints = API.v1.get(
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

API.v1.addRoute(
	'commands.list',
	{ authRequired: true },
	{
		async get() {
			if (!Apps.self?.isLoaded()) {
				return {
					statusCode: 202, // Accepted - apps are not ready, so the list is incomplete. Retry later
					body: {
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
	},
);

const isCommandsRunProps = ajv.compile<{ command: string; params?: string; roomId: string; tmid?: string; triggerId?: string }>({
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
});

const commandsRunResponseSchema = ajv.compile<{ result: unknown }>({
	type: 'object',
	properties: {
		result: {},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: true,
});

const isCommandsPreviewGetProps = ajv.compile<{ command: string; params?: string; roomId: string }>({
	type: 'object',
	properties: {
		command: { type: 'string' },
		params: { type: 'string', nullable: true },
		roomId: { type: 'string' },
	},
	required: ['command', 'roomId'],
	additionalProperties: false,
});

const commandsPreviewGetResponseSchema = ajv.compile<{ preview: Record<string, unknown> | undefined }>({
	type: 'object',
	properties: {
		preview: { type: 'object', nullable: true },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

const isCommandsPreviewPostProps = ajv.compile<{
	command: string;
	params?: string;
	roomId: string;
	tmid?: string;
	triggerId?: string;
	previewItem: SlashCommandPreviewItem;
}>({
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
				type: { type: 'string', enum: ['image', 'video', 'audio', 'text', 'other'] },
				value: { type: 'string' },
			},
			required: ['id', 'type', 'value'],
			additionalProperties: false,
		},
	},
	required: ['command', 'roomId', 'previewItem'],
	additionalProperties: false,
});

const commandsPreviewPostResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

// Expects a body of: { command: 'gimme', params: 'any string value', roomId: 'value', triggerId: 'value' }
API.v1.post(
	'commands.run',
	{
		authRequired: true,
		body: isCommandsRunProps,
		response: {
			200: commandsRunResponseSchema,
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
			return API.v1.forbidden('Not allowed');
		}

		const params = body.params ? body.params : '';
		if (body.tmid) {
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
);

// Expects these query params: command: 'giphy', params: 'mine', roomId: 'value'
API.v1.get(
	'commands.preview',
	{
		authRequired: true,
		query: isCommandsPreviewGetProps,
		response: {
			200: commandsPreviewGetResponseSchema,
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
			return API.v1.forbidden('Not allowed');
		}

		const params = query.params ? query.params : '';

		const preview = await getSlashCommandPreviews({
			cmd,
			params,
			msg: { rid: query.roomId },
			userId: this.userId,
		});

		return API.v1.success({ preview });
	},
);

// Expects a body format of: { command: 'giphy', params: 'mine', roomId: 'value', tmid: 'value', triggerId: 'value', previewItem: { id: 'sadf8' type: 'image', value: 'https://dev.null/gif' } }
API.v1.post(
	'commands.preview',
	{
		authRequired: true,
		body: isCommandsPreviewPostProps,
		response: {
			200: commandsPreviewPostResponseSchema,
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
			return API.v1.forbidden('Not allowed');
		}

		const { params = '' } = body;
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
			body.previewItem,
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
