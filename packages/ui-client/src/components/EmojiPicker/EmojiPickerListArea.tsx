import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

export type EmojiPickerListAreaProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'style'>;

const EmojiPickerListArea = (props: EmojiPickerListAreaProps) => (
	<Box {...props} width='full' height='full' paddingInlineStart={12} overflow='hidden' />
);

export default EmojiPickerListArea;
