import React, { useState, useEffect } from 'react';
import { Callout, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';

import Page from '../../../components/Page';
import { useMethod, useServerInformation, useEndpoint } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { downloadJsonAs } from '../../../lib/download';
import NewInformationPage from './NewInformationPage';

const InformationPage = React.memo(function InformationPage() {
	const t = useTranslation();

	const [isLoading, setLoading] = useState(true);
	const [error, setError] = useState();
	const [statistics, setStatistics] = useState({});
	const [instances, setInstances] = useState([]);
	const [fetchStatistics, setFetchStatistics] = useState(() => () => ({}));
	const getStatistics = useEndpoint('GET', 'statistics');
	const getInstances = useMethod('instances/get');

	useEffect(() => {
		let didCancel = false;

		const fetchStatistics = async ({ refresh = false } = {}) => {
			setLoading(true);
			setError(false);

			try {
				const [statistics, instances] = await Promise.all([
					getStatistics({ refresh }),
					getInstances(),
				]);

				if (didCancel) {
					return;
				}
				setStatistics(statistics);
				setInstances(instances);
			} catch (error) {
				setError(error);
			} finally {
				setLoading(false);
			}
		};

		setFetchStatistics(() => fetchStatistics);

		fetchStatistics();

		return () => {
			didCancel = true;
		};
	}, [getInstances, getStatistics]);

	const info = useServerInformation();


	const handleClickRefreshButton = () => {
		if (isLoading) {
			return;
		}

		fetchStatistics({ refresh: true });
	};

	const handleClickDownloadInfo = () => {
		if (isLoading) {
			return;
		}
		downloadJsonAs(statistics, 'statistics');
	};

	if (error) {
		return <Page>
			<Page.Header title={t('Info')}>
				<ButtonGroup>
					<Button primary type='button' onClick={handleClickRefreshButton}>
						<Icon name='reload' /> {t('Refresh')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Callout type='danger'>
					{t('Error_loading_pages')} {/* : {error.message || error.stack}*/}
				</Callout>
			</Page.ScrollableContentWithShadow>
		</Page>;
	}


	return <NewInformationPage
		isLoading={isLoading}
		info={info}
		statistics={statistics}
		instances={instances}
		onClickRefreshButton={handleClickRefreshButton}
		onClickDownloadInfo={handleClickDownloadInfo}
	/>;
});

export default InformationPage;
