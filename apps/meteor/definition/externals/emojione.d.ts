// Re-export emoji-toolkit as emojione for backward compatibility
declare module 'emojione' {
	export * from 'emoji-toolkit';
	import emojiToolkit from 'emoji-toolkit';
	export = emojiToolkit;
}
