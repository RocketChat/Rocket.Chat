declare module 'meteor/jparker:gravatar' {
	const Gravatar: {
		imageUrl(emailOrHash: string, options: Record<string, unknown>): string;
	};
}
