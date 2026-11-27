declare module '*.ttf' {
	const asset: number;
	export default asset;
}

// Expo inlines EXPO_PUBLIC_* at bundle time; there is no @types/node here to type process.env
declare const process: { env: Record<string, string | undefined> };
