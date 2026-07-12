import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type SettingsCardItemProps = {
	title: ReactNode;
	description?: ReactNode;
	/** Rendered on the right, vertically centered with the title (e.g. a toggle). */
	action?: ReactNode;
	/** Rendered below the title/description (e.g. a select or input spanning the row). */
	children?: ReactNode;
	withDivider?: boolean;
};

const SettingsCardItem = ({ title, description, action, children, withDivider = false }: SettingsCardItemProps) => (
	<Box
		is='section'
		pi={20}
		pb={20}
		pbs={20}
		borderBlockStartWidth={withDivider ? 'default' : undefined}
		borderBlockStartColor={withDivider ? 'light' : undefined}
	>
		<Box display='flex' alignItems='flex-start' justifyContent='space-between'>
			<Box mie={16}>
				<Box fontScale='p2m' color='default'>
					{title}
				</Box>
				{description && (
					<Box fontScale='c1' color='hint' mbs={2}>
						{description}
					</Box>
				)}
			</Box>
			{action && (
				<Box display='flex' alignItems='center' flexShrink={0}>
					{action}
				</Box>
			)}
		</Box>
		{children && <Box mbs={12}>{children}</Box>}
	</Box>
);

export default SettingsCardItem;
