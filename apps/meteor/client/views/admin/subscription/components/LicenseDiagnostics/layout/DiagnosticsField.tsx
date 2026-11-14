import { GridItem, Stack, Text } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type DiagnosticsFieldProps = {
	label: string;
	hint?: string;
	children: ReactNode;
};

const DiagnosticsField = ({ label, hint, children }: DiagnosticsFieldProps) => (
	<GridItem xs={4} sm={4} md={4} lg={6} xl={6}>
		<Stack gap={4}>
			<Text fontScale='c2' color='hint'>
				{label}
			</Text>
			<Stack direction='row' gap={8} align='center' wrap>
				{children}
			</Stack>
			{hint && (
				<Text fontScale='c1' color='hint'>
					{hint}
				</Text>
			)}
		</Stack>
	</GridItem>
);

export default DiagnosticsField;
