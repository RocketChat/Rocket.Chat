declare module 'meteor/jparker:gravatar' {
	export const Gravatar: {
		imageUrl(emailOrHash: string, options: Record<string, unknown>): string;
	};
}
