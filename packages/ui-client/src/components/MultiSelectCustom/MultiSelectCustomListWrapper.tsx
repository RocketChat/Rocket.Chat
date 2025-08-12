import { Box } from '@rocket.chat/fuselage';
import { forwardRef, type ComponentProps } from 'react';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface MultiSelectCustomListWrapperProps extends ComponentProps<typeof Box> {}

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
