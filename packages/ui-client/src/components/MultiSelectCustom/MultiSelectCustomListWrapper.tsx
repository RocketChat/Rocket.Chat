import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef, RefAttributes } from 'react';

export type MultiSelectCustomListWrapperProps = ComponentPropsWithoutRef<typeof Box> & RefAttributes<Element>;

const MultiSelectCustomListWrapper = ({ children, ref }: MultiSelectCustomListWrapperProps) => (
	<Box ref={ref} zIndex={999} width='full' position='absolute' marginBlockStart={40} paddingBlockStart={4}>
		{children}
	</Box>
);

export default MultiSelectCustomListWrapper;
