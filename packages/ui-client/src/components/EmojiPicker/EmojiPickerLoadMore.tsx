import { Box, Button } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

export type EmojiPickerLoadMoreProps = Omit<AllHTMLAttributes<HTMLButtonElement>, 'style' | 'is'>;

const EmojiPickerLoadMore = ({ children, ...props }: EmojiPickerLoadMoreProps) => (
	<Box display='flex' flexDirection='column' alignItems='center' marginBlockEnd={8}>
		<Button {...props} small>
			{children}
		</Button>
	</Box>
);

export default EmojiPickerLoadMore;
