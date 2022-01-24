export declare const slashCommands: {
	commands: { [key: string]: object };
	add(
		command: string,
		callback: Function,
		options: object,
		result: unknown,
		providesPreview: boolean,
		previewer: unknown,
		previewCallback: Function,
	): void;
	run(command: string, params: string, message: object, triggerId: string): Function | void;
	getPreviews(command: string, params: string, message: object, preview: unknown, triggerId: string): Function | void;
	executePreview(command: string, params: string, message: object, preview: unknown, triggerId: string): Function | void;
};
