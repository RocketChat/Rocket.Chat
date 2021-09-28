import { Callout, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import React, { memo, ReactElement } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import Page from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useServerInformation } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { downloadJsonAs } from '../../../lib/download';
import { getServerInstances } from '../../../queries/getServerInstances';
import { getServerStatistics } from '../../../queries/getServerStatistics';
import InformationPage from './InformationPage';

const InformationRoute = (): ReactElement => {
	const t = useTranslation();
	const canViewStatistics = usePermission('view-statistics');

	const info = useServerInformation();
	const { isLoading: isLoadingStatistics, data: statistics } = useQuery(
		'serverStatistics',
		getServerStatistics,
	);
	const { isLoading: isLoadingInstances, data: instances } = useQuery(
		'serverInstances',
		getServerInstances,
	);

	const isLoading = isLoadingStatistics || isLoadingInstances;

	const queryClient = useQueryClient();
	const handleClickRefreshButton = (): void => {
		queryClient.invalidateQueries(['serverStatistics', 'serverInstances']);
	};

	const handleClickDownloadInfo = (): void => {
		if (isLoading) {
			return;
		}
		downloadJsonAs(statistics, 'statistics');
	};

	if (isLoading) {
		return <PageSkeleton />;
	}

	if (!statistics || !instances) {
		return (
			<Page>
				<Page.Header title={t('Info')}>
					<ButtonGroup>
						<Button primary type='button' onClick={handleClickRefreshButton}>
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
				instances={instances}
				onClickRefreshButton={handleClickRefreshButton}
				onClickDownloadInfo={handleClickDownloadInfo}
			/>
		);
	}

	return <NotAuthorizedPage />;
};

export default memo(InformationRoute);
