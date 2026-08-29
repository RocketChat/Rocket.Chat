import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const rowStyles = css`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-block: 4px;
	font-size: 14px;
`;

const valueStyles = css`
	font-variant-numeric: tabular-nums;
	font-weight: 500;
`;

const CallDiagnosticsStatRow = ({ label, value }: { label: string; value: ReactNode }) => (
	<Box className={rowStyles}>
		<Box color='font-secondary-info'>{label}</Box>
		<Box className={valueStyles}>{value ?? '—'}</Box>
	</Box>
);

export default CallDiagnosticsStatRow;
