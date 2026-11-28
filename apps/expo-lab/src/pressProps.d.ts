import 'react';

// Fuselage components still web-only type their props from the DOM, so they do not declare the native press handler
declare module 'react' {
	interface HTMLAttributes<T> {
		onPress?: (() => void) | undefined;
	}
}
