import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type ToneSelectorWrapperProps = {
	caption: string;
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'caption'>;

const ToneSelectorWrapper = ({ caption, children, ...props }: ToneSelectorWrapperProps) => {
	return (
		<Box {...props} display='flex' alignItems='center'>
			<Box fontScale='c2'>{caption}</Box>
			{children}
		</Box>
	);
};

export default ToneSelectorWrapper;
