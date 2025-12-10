import { Box } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV1, HeaderV1Toolbar, SidebarToggler } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import RoomLayout from './layout/RoomLayout';
import NotFoundState from '../../components/NotFoundState';

const RoomNotFound = (): ReactElement => {
	const { t } = useTranslation();
	const { isMobile } = useLayout();

	return (
		<RoomLayout
			header={
				isMobile && (
					<FeaturePreview feature='newNavigation'>
						<FeaturePreviewOff>
							<HeaderV1 justifyContent='start'>
								<HeaderV1Toolbar>
									<SidebarToggler />
								</HeaderV1Toolbar>
							</HeaderV1>
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
