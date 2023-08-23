import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerHeader = (props: Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'style'>) => (
	<Box {...props} display='flex' alignItems='center' pbs={12} pi={12} />
);

export default EmojiPickerHeader;
