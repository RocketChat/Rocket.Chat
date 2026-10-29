import { Box, Text } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type ToneSelectorWrapperProps = {
	caption: string;
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'caption'>;

const ToneSelectorWrapper = ({ caption, children, ...props }: ToneSelectorWrapperProps) => {
	return (
		<Box {...props} display='flex' alignItems='center' gap={4}>
			<Text fontScale='c2'>{caption}</Text>
			{children}
		</Box>
	);
};

export default ToneSelectorWrapper;
