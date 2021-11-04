import { Button, ButtonGroup, Icon, Skeleton } from '@rocket.chat/fuselage';
import React, { useState, useEffect, FC } from 'react';

import Page from '../../../components/Page';
import { useRoute } from '../../../contexts/RouterContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import MarketplaceTable from './MarketplaceTable';

const MarketplacePage: FC = () => {
	const t = useTranslation();
	const cloudRoute = useRoute('cloud');
	const [isLoggedInCloud, setIsLoggedInCloud] = useState();
	const checkUserLoggedIn = useMethod('cloud:checkUserLoggedIn');

	useEffect(() => {
		const initialize = async (): Promise<void> => {
			setIsLoggedInCloud(await checkUserLoggedIn());
		};
		initialize();
	}, [checkUserLoggedIn]);

	const handleLoginButtonClick = (): void => {
		cloudRoute.push();
	};

	return (
		<Page>
			<Page.Header title={t('Marketplace')}>
				{!isLoggedInCloud && (
					<ButtonGroup>
						<Button disabled={isLoggedInCloud === undefined} onClick={handleLoginButtonClick}>
							{isLoggedInCloud === undefined ? (
								<Skeleton width='x80' />
							) : (
								<>
									<Icon name='download' /> {t('Login')}
								</>
							)}
						</Button>
					</ButtonGroup>
				)}
			</Page.Header>
			<Page.Content>
				<MarketplaceTable />
			</Page.Content>
		</Page>
	);
};

export default MarketplacePage;
