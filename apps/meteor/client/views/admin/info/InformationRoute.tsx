import { Callout, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import { usePermission, useServerInformation, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement } from 'react';

import Page from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import { downloadJsonAs } from '../../../lib/download';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import InformationPage from './InformationPage';
import { useInformationPageData } from './useInformationPageData';

const InformationRoute = (): ReactElement => {
	const t = useTranslation();
	const canViewStatistics = usePermission('view-statistics');

	const { isLoading, isError, data, refetch } = useInformationPageData();
	const info = useServerInformation();
	const [statistics, { instances }] = data || [];

	const handleClickDownloadInfo = (): void => {
		if (isLoading) {
			return;
		}
		downloadJsonAs(statistics, 'statistics');
	};

	if (isLoading) {
		return <PageSkeleton />;
	}

	if (isError || !statistics) {
		return (
			<Page>
				<Page.Header title={t('Info')}>
					<ButtonGroup>
						<Button primary type='button' onClick={refetch}>
							<Icon name='reload' /> {t('Refresh')}
						</Button>
					</ButtonGroup>
				</Page.Header>
				<Page.ScrollableContentWithShadow>
					<Callout type='danger'>{t('Error_loading_pages')}</Callout>
				</Page.ScrollableContentWithShadow>
			</Page>
		);
	}

	if (canViewStatistics) {
		return (
			<InformationPage
				canViewStatistics={canViewStatistics}
				info={info}
				statistics={statistics}
				instances={instances || []}
				onClickRefreshButton={refetch}
				onClickDownloadInfo={handleClickDownloadInfo}
			/>
		);
	}

	return <NotAuthorizedPage />;
};

export default memo(InformationRoute);
