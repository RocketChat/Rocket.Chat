import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

export type EmojiPickerHeaderProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'style'>;

const EmojiPickerHeader = (props: EmojiPickerHeaderProps) => (
	<Box {...props} display='flex' alignItems='center' paddingBlockStart={12} paddingInline={12} />
);

export default EmojiPickerHeader;
