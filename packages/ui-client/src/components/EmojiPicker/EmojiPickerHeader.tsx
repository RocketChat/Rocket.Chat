import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerHeader = (props: Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'style'>) => (
	<Box {...props} display='flex' alignItems='center' paddingBlockStart={12} paddingInline={12} />
);

export default EmojiPickerHeader;
