export type CommandsEndpoints = {
	'/v1/commands.list': {
		GET: () => {
			commands: { command: string }[];
		};
	};
};
