import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppStatusTagLabelProps = {
	tone?: 'default' | 'warning' | 'danger';
	children: ReactNode;
};

const toneColors = {
	default: 'font-default',
	warning: 'status-font-on-warning',
	danger: 'status-font-on-danger',
} as const;

/**
 * The content of an app status tag: its icon and label, coloured for the status's tone.
 */
const AppStatusTagLabel = ({ tone = 'default', children }: AppStatusTagLabelProps) => (
	<Box display='flex' color={toneColors[tone]} alignItems='center' gap='x4'>
		{children}
	</Box>
);

export default AppStatusTagLabel;
