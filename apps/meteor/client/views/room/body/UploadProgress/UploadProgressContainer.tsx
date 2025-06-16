import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const UploadProgressContainer = (props: ComponentProps<typeof Box>) => {
	return <Box position='relative' display='flex' flexDirection='column' overflow='hidden' mi={24} mbs={8} zIndex={2} {...props} />;
};

export default UploadProgressContainer;
