import type { SlashCommand, SlashCommandPreviews } from '../../../core-typings/dist';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type CommandsEndpoints = {
	'commands.get': {
		GET: (params: { command: string }) => {
			command: SlashCommand;
		};
	};
	'commands.list': {
		GET: (
			params: PaginatedRequest<{
				fields?: string;
			}>,
		) => PaginatedResult<{
			commands: SlashCommand[];
		}>;
	};
	'commands.run': {
		POST: (params: { command: string; params?: string; roomId: string; tmid?: string; triggerId: string }) => {
			result: unknown;
		};
	};
	'commands.preview': {
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
