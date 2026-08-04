import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

export type EmojiPickerFooterProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>;

const EmojiPickerFooter = (props: EmojiPickerFooterProps) => (
	<Box
		{...props}
		backgroundColor='neutral'
		display='flex'
		flexDirection='column'
		alignItems='center'
		color='secondary-info'
		fontScale='micro'
		paddingBlock={8}
	/>
);

export default EmojiPickerFooter;
