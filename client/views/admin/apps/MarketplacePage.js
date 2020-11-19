import { Button, ButtonGroup, Icon, Skeleton } from '@rocket.chat/fuselage';
import React, { useState, useEffect } from 'react';

import Page from '../../../components/Page';
import { useRoute } from '../../../contexts/RouterContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import MarketplaceTable from './MarketplaceTable';

function MarketplacePage() {
	const t = useTranslation();
	const cloudRoute = useRoute('cloud');
	const [isLoggedInCloud, setIsLoggedInCloud] = useState();
	const checkUserLoggedIn = useMethod('cloud:checkUserLoggedIn');

	useEffect(() => {
		const initialize = async () => {
			setIsLoggedInCloud(await checkUserLoggedIn());
		};
		initialize();
	}, [checkUserLoggedIn]);

	const handleLoginButtonClick = () => {
		cloudRoute.push();
	};

	return <Page>
		<Page.Header title={t('Marketplace')}>
			{!isLoggedInCloud && <ButtonGroup>
				<Button disabled={isLoggedInCloud === undefined} onClick={handleLoginButtonClick}>
					{isLoggedInCloud === undefined
						? <Skeleton width='x80' />
						: <>
							<Icon name='download'/> {t('Login')}
						</>}
				</Button>
			</ButtonGroup>}
		</Page.Header>
		<Page.Content>
			<MarketplaceTable />
		</Page.Content>
	</Page>;
}

export default MarketplacePage;
