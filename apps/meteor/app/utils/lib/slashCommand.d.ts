export declare const slashCommands: {
	commands: { [key: string]: any };
	add(
		command: string,
		callback: Function | undefined,
		options: object,
		result: unknown | undefined,
		providesPreview: boolean,
		previewer: unknown | undefined,
		previewCallback: Function | undefined,
	): void;
	run(command: string, params: string, message: object, triggerId: string | undefined): Function | void;
	getPreviews(command: string, params: string, message: object, preview?: unknown, triggerId?: string | undefined): Function | void;
	executePreview(command: string, params: string, message: object, preview: unknown, triggerId: string | undefined): Function | void;
};
