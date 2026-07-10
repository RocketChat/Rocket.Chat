import { createContext } from 'preact';

export const PopoverContext = createContext<{ open: (renderer: any, props: any, options?: { currentTarget?: HTMLElement }) => void }>({
	open: () => {
		// noop
	},
});
