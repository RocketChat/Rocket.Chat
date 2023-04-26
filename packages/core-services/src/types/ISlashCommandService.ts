import type { SlashCommand } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export interface ISlashCommandService extends IServiceClass {
	getCommand(command: string): SlashCommand;
	setCommand(command: SlashCommand): void;
	setAppCommand(command: SlashCommand): void;
	removeCommand(command: string): void;
}
