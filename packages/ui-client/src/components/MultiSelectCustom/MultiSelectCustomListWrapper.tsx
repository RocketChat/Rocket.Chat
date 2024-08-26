import { Box } from '@rocket.chat/fuselage';
import { forwardRef, type ComponentProps } from 'react';

const MultiSelectCustomListWrapper = forwardRef<Element, ComponentProps<typeof Box>>(function MultiSelectCustomListWrapper(
	{ children },
	ref,
) {
	return (
		<Box ref={ref} zIndex={999} w='full' position='absolute' mbs={40} pbs={4}>
			{children}
		</Box>
	);
});

export default MultiSelectCustomListWrapper;
