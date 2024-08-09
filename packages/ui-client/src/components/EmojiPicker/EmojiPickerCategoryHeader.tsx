import { ButtonGroup, Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const EmojiPickerCategoryHeader = (props: ComponentProps<typeof ButtonGroup>) => (
	<Box mbs={12} mi={12}>
		<ButtonGroup small stretch {...props} />
	</Box>
);

export default EmojiPickerCategoryHeader;
