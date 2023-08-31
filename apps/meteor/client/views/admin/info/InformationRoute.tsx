import type { IStats, Serialized } from '@rocket.chat/core-typings';
import { Callout, ButtonGroup, Button } from '@rocket.chat/fuselage';
import type { IInstance } from '@rocket.chat/rest-typings';
import { usePermission, useServerInformation, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState, useEffect, memo } from 'react';

import Page from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import { downloadJsonAs } from '../../../lib/download';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import InformationPage from './InformationPage';

type fetchStatisticsCallback = ((params: { refresh: boolean }) => void) | (() => void);

const InformationRoute = (): ReactElement => {
	const t = useTranslation();
	const canViewStatistics = usePermission('view-statistics');

	const [isLoading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [statistics, setStatistics] = useState<IStats>();
	const [instances, setInstances] = useState<Serialized<IInstance[]>>([]);
	const [fetchStatistics, setFetchStatistics] = useState<fetchStatisticsCallback>(() => (): void => undefined);
	const getStatistics = useEndpoint('GET', '/v1/statistics');
	const getInstances = useEndpoint('GET', '/v1/instances.get');

	useEffect(() => {
		let didCancel = false;

		const fetchStatistics = async ({ refresh = false } = {}): Promise<void> => {
			setLoading(true);
			setError(false);

			try {
				const [statistics, instancesData] = await Promise.all([getStatistics({ refresh: refresh ? 'true' : 'false' }), getInstances()]);

				if (didCancel) {
					return;
				}
				setStatistics({
					...statistics,
					lastMessageSentAt: statistics.lastMessageSentAt ? new Date(statistics.lastMessageSentAt) : undefined,
				});
				setInstances(instancesData.instances);
			} catch (error) {
				setError(!!error);
			} finally {
				setLoading(false);
			}
		};

		setFetchStatistics(() => fetchStatistics);

		fetchStatistics();

		return (): void => {
			didCancel = true;
		};
	}, [canViewStatistics, getInstances, getStatistics]);

	const info = useServerInformation();

	const handleClickRefreshButton = (): void => {
		if (isLoading) {
			return;
		}

		fetchStatistics({ refresh: true });
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

	if (error || !statistics) {
		return (
			<Page>
				<Page.Header title={t('Workspace')}>
					<ButtonGroup>
						<Button icon='reload' primary type='button' onClick={handleClickRefreshButton}>
							{t('Refresh')}
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
