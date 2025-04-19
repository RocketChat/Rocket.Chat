import { Box } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, Header, HeaderToolbar } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import RoomLayout from './layout/RoomLayout';
import NotFoundState from '../../components/NotFoundState';
import { SidebarTogglerV2 } from '../../components/SidebarTogglerV2';

const RoomNotFound = (): ReactElement => {
	const { t } = useTranslation();
	const { isMobile } = useLayout();

	return (
		<RoomLayout
			header={
				isMobile && (
					<FeaturePreview feature='newNavigation'>
						<FeaturePreviewOff>
							<Header justifyContent='start'>
								<HeaderToolbar>
									<SidebarTogglerV2 />
								</HeaderToolbar>
							</Header>
						</FeaturePreviewOff>
						<FeaturePreviewOn>{null}</FeaturePreviewOn>
					</FeaturePreview>
				)
			}
			body={
				<Box display='flex' justifyContent='center' height='full'>
					<NotFoundState title={t('Room_not_found')} subtitle={t('Room_not_exist_or_not_permission')} />
				</Box>
			}
		/>
	);
};

export default RoomNotFound;
