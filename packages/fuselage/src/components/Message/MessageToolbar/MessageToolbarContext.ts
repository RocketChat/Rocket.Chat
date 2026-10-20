import { createStyledContext } from '@tamagui/web';

/** Lets a `MessageToolbarWrapper` keep the toolbar inside it shown. */
export const MessageToolbarContext = createStyledContext({
	visible: false,
});
