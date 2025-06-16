import { Messages } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import objectPath from 'object-path';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { executeSlashCommandPreview } from '../../../lib/server/methods/executeSlashCommandPreview';
import { getSlashCommandPreviews } from '../../../lib/server/methods/getSlashCommandPreviews';
import { slashCommands } from '../../../utils/server/slashCommand';
import { API } from '../api';
import { getLoggedInUser } from '../helpers/getLoggedInUser';
import { getPaginationItems } from '../helpers/getPaginationItems';

API.v1.addRoute(
	'commands.get',
	{ authRequired: true },
	{
		get() {
			const params = this.queryParams;

			if (typeof params.command !== 'string') {
				return API.v1.failure('The query param "command" must be provided.');
			}

			const cmd = slashCommands.commands[params.command.toLowerCase()];

			if (!cmd) {
				return API.v1.failure(`There is no command in the system by the name of: ${params.command}`);
			}

			return API.v1.success({ command: cmd });
		},
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
				offset,
				count: commands.length,
				total: totalCount,
			});
		},
	},
);

// Expects a body of: { command: 'gimme', params: 'any string value', roomId: 'value', triggerId: 'value' }
API.v1.addRoute(
	'commands.run',
	{ authRequired: true },
	{
		async post() {
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
				return API.v1.forbidden();
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
	},
);

API.v1.addRoute(
	'commands.preview',
	{ authRequired: true },
	{
		// Expects these query params: command: 'giphy', params: 'mine', roomId: 'value'
		async get() {
			const query = this.queryParams;
			const user = await getLoggedInUser(this.request);

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

			if (!(await canAccessRoomIdAsync(query.roomId, user?._id))) {
				return API.v1.forbidden();
			}

			const params = query.params ? query.params : '';

			const preview = await getSlashCommandPreviews({
				cmd,
				params,
				msg: { rid: query.roomId },
			});

			return API.v1.success({ preview });
		},

		// Expects a body format of: { command: 'giphy', params: 'mine', roomId: 'value', tmid: 'value', triggerId: 'value', previewItem: { id: 'sadf8' type: 'image', value: 'https://dev.null/gif' } }
		async post() {
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
				return API.v1.forbidden();
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
				body.previewItem,
			);

			return API.v1.success();
		},
	},
);
