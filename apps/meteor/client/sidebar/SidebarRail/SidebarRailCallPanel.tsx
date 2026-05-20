import { Box, Sidepanel } from '@rocket.chat/fuselage';
import { MediaCallWidgetSlot } from '@rocket.chat/ui-voip';
import { useTranslation } from 'react-i18next';

const SidebarRailCallPanel = () => {
	const { t } = useTranslation();

	return (
		<Box width='x280' minWidth='x280'>
			<Sidepanel role='complementary' aria-label={t('Calls')}>
				<Box p={16}>
					<MediaCallWidgetSlot />
				</Box>
			</Sidepanel>
		</Box>
	);
};

export default SidebarRailCallPanel;
