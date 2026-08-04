import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type AppsLogItemFieldProps = {
	field: ReactNode | string;
	label: string;
} & BoxProps;

export const AppsLogItemField = ({ field, label, ...props }: AppsLogItemFieldProps) => {
	return (
		<Box marginBlock={16} display='flex' color='default' flexDirection='column' {...props}>
			<Box fontWeight={700}>{label}</Box>
			{field}
		</Box>
	);
};
