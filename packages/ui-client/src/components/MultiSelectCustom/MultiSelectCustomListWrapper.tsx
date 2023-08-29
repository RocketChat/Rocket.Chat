import { Box } from '@rocket.chat/fuselage';
import { forwardRef, type ComponentProps } from 'react';

const MultiSelectCustomListWrapper = forwardRef<Element, ComponentProps<typeof Box>>(function MultiSelectCustomListWrapper(
	{ children },
	ref,
) {
	return (
		<Box ref={ref} zIndex='2' w='full' position='absolute' mbs='x40' pbs='x4'>
			{children}
		</Box>
	);
});

export default MultiSelectCustomListWrapper;
