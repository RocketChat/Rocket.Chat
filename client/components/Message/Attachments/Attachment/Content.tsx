import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const Content: FC<ComponentProps<typeof Box> & { isInner: boolean | undefined }> = ({
	isInner,
	...props
}) => (
	<Box
		rcx-attachment__content
		width='full'
		{...(!isInner ? { mb: 'x4' } : { mbs: '4px', mbe: '-8px' })}
		{...props}
	/>
);

export default Content;
