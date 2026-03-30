import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

type FieldProps = {
	short?: boolean;
	title: ReactNode;
	value: ReactNode;
} & Omit<ComponentProps<typeof Box>, 'title' | 'value'>;

const Field = ({ title, value, ...props }: FieldProps) => (
	<Box mb={4} pi={4} width='full' flexBasis={100} flexShrink={0} color='default' {...props}>
		<Box fontScale='p2m' color='hint'>{title}</Box>
		<Box fontScale='p1m' color='default'>
			{value}
		</Box>
	</Box>
);

export default Field;
