import { ButtonGroup, Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type EmojiPickerCategoryHeaderProps = ComponentPropsWithoutRef<typeof ButtonGroup>;

const EmojiPickerCategoryHeader = (props: EmojiPickerCategoryHeaderProps) => (
	<Box marginBlockStart={12} marginInline={12}>
		<ButtonGroup small stretch {...props} />
	</Box>
);

export default EmojiPickerCategoryHeader;
