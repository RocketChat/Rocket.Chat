import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC, ReactNode } from 'react';
import React from 'react';

type FieldProps = {
	short?: boolean;
	title: ReactNode;
	value: ReactNode;
} & Omit<ComponentProps<typeof Box>, 'title' | 'value'>;

const Field: FC<FieldProps> = ({ title, value, ...props }) => (
	<Box mb='x4' pi='x4' width='full' flexBasis={100} flexShrink={0} {...props}>
		<Box fontScale='p2m' color='default'>
			{title}
		</Box>
		{value}
	</Box>
);

export default Field;
