import type { SlashCommandPreviews } from '@rocket.chat/core-typings';

export type CommandsEndpoints = {
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
