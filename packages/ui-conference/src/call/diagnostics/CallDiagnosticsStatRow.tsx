import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const valueStyles = css`
	font-variant-numeric: tabular-nums;
`;

const CallDiagnosticsStatRow = ({ label, value }: { label: string; value: ReactNode }) => (
	<Box display='flex' justifyContent='space-between' alignItems='center' paddingBlock={4} fontScale='p2'>
		<Box color='font-secondary-info'>{label}</Box>
		<Box className={valueStyles} fontScale='p2m'>
			{value ?? '—'}
		</Box>
	</Box>
);

export default CallDiagnosticsStatRow;
