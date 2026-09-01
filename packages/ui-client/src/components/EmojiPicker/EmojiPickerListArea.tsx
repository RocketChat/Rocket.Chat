import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerListArea = (props: Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'style'>) => (
	<Box {...props} width='full' height='full' paddingInlineStart={12} overflow='hidden' />
);

export default EmojiPickerListArea;
