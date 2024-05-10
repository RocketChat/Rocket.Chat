import type { SlashCommand, SlashCommandPreviews } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type CommandsEndpoints = {
	'/v1/commands.get': {
		GET: (params: { command: string }) => {
			command: Pick<SlashCommand, 'clientOnly' | 'command' | 'description' | 'params' | 'providesPreview'>;
		};
	};
	'/v1/commands.list': {
		GET: (
			params?: PaginatedRequest<{
				fields?: string;
			}>,
		) => PaginatedResult<{
			commands: Pick<SlashCommand, 'clientOnly' | 'command' | 'description' | 'params' | 'providesPreview' | 'appId'>[];
		}>;
	};
	'/v1/commands.run': {
		POST: (params: { command: string; params?: string; roomId: string; tmid?: string; triggerId: string }) => {
			result: unknown;
		};
	};
	'/v1/commands.preview': {
		GET: (params: { command: string; params?: string; roomId: string }) => {
			preview: SlashCommandPreviews;
		};
		POST: (params: {
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
		}) => void;
	};
};
