import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerFooter = (props: Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'style'>) => {
	return <Box {...props} display='flex' flexDirection='column' alignItems='center' fontScale='c1' p='x4' />;
};

export default EmojiPickerFooter;
