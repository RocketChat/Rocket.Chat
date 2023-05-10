import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerHeader = (props: Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'style'>) => {
	return <Box {...props} display='flex' alignItems='center' pbs='x12' pi='x12' />;
};

export default EmojiPickerHeader;
