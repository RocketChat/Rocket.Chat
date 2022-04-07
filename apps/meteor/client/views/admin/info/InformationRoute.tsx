import { Callout, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import React, { useState, useEffect, memo, ReactElement } from 'react';

import { IStats } from '../../../../definition/IStats';
import Page from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useMethod, useServerInformation, useEndpoint } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
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
	const [instances, setInstances] = useState([]);
	const [fetchStatistics, setFetchStatistics] = useState<fetchStatisticsCallback>(() => (): void => undefined);
	const getStatistics = useEndpoint('GET', 'statistics');
	const getInstances = useMethod('instances/get');

	useEffect(() => {
		let didCancel = false;

		const fetchStatistics = async ({ refresh = false } = {}): Promise<void> => {
			setLoading(true);
			setError(false);

			try {
				const [statistics, instances] = await Promise.all([getStatistics({ refresh }), getInstances()]);

				if (didCancel) {
					return;
				}
				setStatistics(statistics);
				setInstances(instances);
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
