import { Box, Button } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerLoadMore = ({ children, ...props }: Omit<AllHTMLAttributes<HTMLButtonElement>, 'style' | 'is'>) => (
	<Box display='flex' flexDirection='column' alignItems='center' marginBlockEnd={8}>
		<Button {...props} small>
			{children}
		</Button>
	</Box>
);

export default EmojiPickerLoadMore;
