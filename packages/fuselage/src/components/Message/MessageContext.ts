import { createStyledContext } from '@tamagui/web';

/** What a `Message` tells the parts rendered inside it, in place of the descendant selectors the SCSS used. */
export const MessageContext = createStyledContext({
	inMessage: false,
	pending: false,
});
