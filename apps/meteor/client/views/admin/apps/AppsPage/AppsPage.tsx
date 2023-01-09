import { Button, ButtonGroup, Icon, Skeleton, Tabs } from '@rocket.chat/fuselage';
import { useRoute, useSetting, useMethod, useTranslation, useCurrentRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useState } from 'react';

import Page from '../../../../components/Page';
import AppsPageContent from './AppsPageContent';

type AppsPageProps = {
	isMarketplace: boolean;
};

const AppsPage = ({ isMarketplace }: AppsPageProps): ReactElement => {
	const t = useTranslation();

	const isDevelopmentMode = useSetting('Apps_Framework_Development_Mode');
	const cloudRoute = useRoute('cloud');
	const checkUserLoggedIn = useMethod('cloud:checkUserLoggedIn');

	const [currentRouteName] = useCurrentRoute();
	if (!currentRouteName) {
		throw new Error('No current route name');
	}
	const router = useRoute(currentRouteName);

	const context = useRouteParameter('context');

	const [isLoggedInCloud, setIsLoggedInCloud] = useState();

	useEffect(() => {
		const initialize = async (): Promise<void> => {
			setIsLoggedInCloud(await checkUserLoggedIn());
		};
		initialize();
	}, [checkUserLoggedIn]);

	const handleLoginButtonClick = (): void => {
		cloudRoute.push();
	};

	const handleUploadButtonClick = (): void => {
		context && router.push({ context, page: 'install' });
	};

	const handleMarketplaceTabClick = (): void => router.push({ context: 'all', page: 'list' });

	const handleInstalledTabClick = (): void => router.push({ context: 'installed', page: 'list' });

	return (
		<Page background='tint'>
			<Page.Header title={t('Apps')}>
				<ButtonGroup>
					{isMarketplace && !isLoggedInCloud && (
						<Button disabled={isLoggedInCloud === undefined} onClick={handleLoginButtonClick}>
							{isLoggedInCloud === undefined ? (
								<Skeleton width='x80' />
							) : (
								<>
									<Icon name='download' /> {t('Login')}
								</>
							)}
						</Button>
					)}
					{Boolean(isDevelopmentMode) && (
						<Button primary onClick={handleUploadButtonClick}>
							<Icon size='x20' name='upload' /> {t('Upload_app')}
						</Button>
					)}
				</ButtonGroup>
			</Page.Header>
			<Tabs>
				<Tabs.Item onClick={handleMarketplaceTabClick} selected={context === 'all'}>
					{t('Marketplace')}
				</Tabs.Item>
				<Tabs.Item onClick={handleInstalledTabClick} selected={context === 'installed'}>
					{t('Installed')}
				</Tabs.Item>
			</Tabs>
			<Page.Content overflowY='auto'>
				<AppsPageContent />
			</Page.Content>
		</Page>
	);
};

export default AppsPage;
