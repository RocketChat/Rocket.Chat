import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerNotFound = (props: Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'style'>) => (
	<Box {...props} display='flex' flexDirection='column' alignItems='center' fontScale='c1' marginBlock={8} width='full' />
);

export default EmojiPickerNotFound;
