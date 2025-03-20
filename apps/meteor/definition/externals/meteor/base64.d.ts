declare module 'meteor/base64' {
	export const Base64: {
		encode: (value: string) => string;
		decode: (value: string) => string;
	};
}
