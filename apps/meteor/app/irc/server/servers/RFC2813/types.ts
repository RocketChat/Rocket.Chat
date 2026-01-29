/**
 * Shared types for RFC2813 IRC server implementation
 */

import type { RFC2813 } from './index';
import type * as peerCommandHandlers from './peerCommandHandlers';

export type ParsedMessage = {
	prefix?: string;
	nick?: string;
	user?: string;
	host?: string;
	server?: string;
	command: keyof typeof peerCommandHandlers;
	rawCommand: string;
	commandType: string;
	args: string[];
};

export type CommandResult = {
	identifier: string;
	args: Record<string, any>;
};

export type Command = {
	prefix?: string;
	command: string;
	parameters?: string[];
	trailer?: string;
};

export type Config = {
	server: {
		name: string;
		host: string;
		port: number;
		description: string;
	};
	passwords: {
		local: string;
	};
};

export type RFC2813Context = RFC2813;
