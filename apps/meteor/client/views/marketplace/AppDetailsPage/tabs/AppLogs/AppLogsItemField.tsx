import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

export type AppsLogItemFieldProps = {
	field: ReactNode | string;
	label: string;
} & ComponentProps<typeof Box>;

export const AppsLogItemField = ({ field, label, ...props }: AppsLogItemFieldProps) => {
	return (
		<Box marginBlock={16} display='flex' color='default' flexDirection='column' {...props}>
			<Box fontWeight={700}>{label}</Box>
			{field}
		</Box>
	);
};
