import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';

type WidgetHeaderProps = {
	title: ReactNode;
	children: ReactNode;
};

// TODO: A11Y - duration/title
const WidgetHeader = ({ title, children }: WidgetHeaderProps): ReactElement => {
	return (
		<Box is='header' mi={12} mb={4} display='flex' alignItems='center' justifyContent='space-between'>
			<Box is='h3' color='titles-labels' fontScale='p1b' id='rcx-media-call-widget-title'>
				{title}
			</Box>
			<Box mis={8}>{children}</Box>
		</Box>
	);
};
export default WidgetHeader;
