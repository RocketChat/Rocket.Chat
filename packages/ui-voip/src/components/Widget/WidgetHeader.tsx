import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { VisuallyHidden } from 'react-aria';
import { useTranslation } from 'react-i18next';

type WidgetHeaderProps = {
	title: ReactNode;
	children: ReactNode;
};

// TODO: A11Y - duration/title
const WidgetHeader = ({ title, children }: WidgetHeaderProps) => {
	const { t } = useTranslation();
	return (
		<Box is='header' mi={12} mb={4} display='flex' alignItems='center' justifyContent='space-between'>
			<VisuallyHidden id='rcx-media-call-widget-title-prefix'>{t('Voice_call')}</VisuallyHidden>
			<Box is='h3' color='titles-labels' fontScale='p1b' id='rcx-media-call-widget-title'>
				{title}
			</Box>
			<Box mis={8} display='flex' flexDirection='row'>
				{children}
			</Box>
		</Box>
	);
};
export default WidgetHeader;
