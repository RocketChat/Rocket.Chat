import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

export type FieldProps = {
	short?: boolean;
	title: ReactNode;
	value: ReactNode;
} & Omit<ComponentProps<typeof Box>, 'title' | 'value'>;

// TODO: description missing color token
const Field = ({ title, value, ...props }: FieldProps) => (
	<Box marginBlock={4} paddingInline={4} width='full' flexBasis={100} flexShrink={0} color='default' {...props}>
		<Box fontScale='p2m'>{title}</Box>
		{value}
	</Box>
);

export default Field;
