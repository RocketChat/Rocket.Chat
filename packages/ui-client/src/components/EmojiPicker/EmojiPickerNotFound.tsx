import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

export type EmojiPickerNotFoundProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'style'>;

const EmojiPickerNotFound = (props: EmojiPickerNotFoundProps) => (
	<Box {...props} display='flex' flexDirection='column' alignItems='center' fontScale='c1' marginBlock={8} width='full' />
);

export default EmojiPickerNotFound;
