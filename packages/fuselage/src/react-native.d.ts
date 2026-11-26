declare module 'react-native' {
	import type { ElementType, ForwardRefExoticComponent, RefAttributes } from 'react';

	// A stand-in until the repository depends on `react-native`: a component `styled()` takes, whose props are open
	export const Image: ForwardRefExoticComponent<Record<string, unknown> & RefAttributes<unknown>>;
	export const Pressable: ElementType;
	export const Text: ElementType;
	export const TextInput: ElementType;
	export const View: ElementType;
}
