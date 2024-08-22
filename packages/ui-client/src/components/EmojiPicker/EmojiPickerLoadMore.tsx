import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerLoadMore = (props: Omit<AllHTMLAttributes<HTMLAnchorElement>, 'style'>) => (
	<Box display='flex' flexDirection='column' alignItems='center' mbe={8}>
		<Box {...props} is='a' fontScale='c1' />
	</Box>
);

export default EmojiPickerLoadMore;
