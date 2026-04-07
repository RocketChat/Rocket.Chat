import type { SlashCommand, SlashCommandPreviews } from '@rocket.chat/core-typings';

import { ajv, ajvQuery } from './Ajv';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

type CommandsListProps = PaginatedRequest<{
	fields?: string;
}>;

const CommandsListPropsSchema = {
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

export const isCommandsListProps = ajvQuery.compile<CommandsListProps>(CommandsListPropsSchema);

type CommandsRunProps = {
	command: string;
	params?: string;
	roomId: string;
	tmid?: string;
	triggerId: string;
};

const CommandsRunPropsSchema = {
	type: 'object',
	properties: {
		command: { type: 'string' },
		params: { type: 'string', nullable: true },
		roomId: { type: 'string' },
		tmid: { type: 'string', nullable: true },
		triggerId: { type: 'string' },
	},
	required: ['command', 'roomId', 'triggerId'],
	additionalProperties: false,
};

export const isCommandsRunProps = ajv.compile<CommandsRunProps>(CommandsRunPropsSchema);

type CommandsPreviewGETProps = {
	command: string;
	params?: string;
	roomId: string;
};

const CommandsPreviewGETPropsSchema = {
	type: 'object',
	properties: {
		command: { type: 'string' },
		params: { type: 'string', nullable: true },
		roomId: { type: 'string' },
	},
	required: ['command', 'roomId'],
	additionalProperties: false,
};

export const isCommandsPreviewGETProps = ajvQuery.compile<CommandsPreviewGETProps>(CommandsPreviewGETPropsSchema);

type CommandsPreviewPOSTProps = {
	command: string;
	params?: string;
	roomId: string;
	previewItem: {
		id: string;
		type: string;
		value: string;
	};
	triggerId: string;
	tmid?: string;
};

const CommandsPreviewPOSTPropsSchema = {
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
		triggerId: { type: 'string' },
		tmid: { type: 'string', nullable: true },
	},
	required: ['command', 'roomId', 'previewItem', 'triggerId'],
	additionalProperties: false,
};

export const isCommandsPreviewPOSTProps = ajv.compile<CommandsPreviewPOSTProps>(CommandsPreviewPOSTPropsSchema);

export type CommandsEndpoints = {
	'/v1/commands.list': {
		GET: (
			params?: CommandsListProps,
		) => PaginatedResult<{
			appsLoaded: boolean;
			commands: Pick<SlashCommand, 'clientOnly' | 'command' | 'description' | 'params' | 'providesPreview' | 'appId'>[];
		}>;
	};
	'/v1/commands.run': {
		POST: (params: CommandsRunProps) => {
			result: unknown;
		};
	};
	'/v1/commands.preview': {
		GET: (params: CommandsPreviewGETProps) => {
			preview: SlashCommandPreviews;
		};
		POST: (params: CommandsPreviewPOSTProps) => void;
	};
};
