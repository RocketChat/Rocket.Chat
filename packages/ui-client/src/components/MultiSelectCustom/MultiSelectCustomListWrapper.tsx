import { Box } from '@rocket.chat/fuselage';
import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';

export type MultiSelectCustomListWrapperProps = ComponentPropsWithoutRef<typeof Box>;

const MultiSelectCustomListWrapper = forwardRef<Element, MultiSelectCustomListWrapperProps>(function MultiSelectCustomListWrapper(
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
