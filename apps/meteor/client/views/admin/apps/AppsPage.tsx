import { Button, ButtonGroup, Icon, Skeleton, Tabs } from '@rocket.chat/fuselage';
import { useRoute, useSetting, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect, useState, ReactElement } from 'react';

import Page from '../../../components/Page';
import AppsPageContent from './AppsPageContent';

type AppsPageProps = {
	isMarketplace: boolean;
	canManageApps: boolean;
	isAdminSection: boolean;
	currentRouteName: string;
};

const AppsPage = ({ isMarketplace, canManageApps, isAdminSection, currentRouteName }: AppsPageProps): ReactElement => {
	const t = useTranslation();

	const isDevelopmentMode = useSetting('Apps_Framework_Development_Mode');
	const checkUserLoggedIn = useMethod('cloud:checkUserLoggedIn');

	const router = useRoute(currentRouteName);
	const cloudRoute = useRoute('cloud');

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
		router.push({ context: 'install' });
	};

	const handleMarketplaceTabClick = (): void => {
		router.push({ context: '' });
	};

	const handleInstalledTabClick = (): void => {
		router.push({ context: 'installed' });
	};

	return (
		<Page background='tint'>
			<Page.Header title={t('Apps')}>
				<ButtonGroup>
					{isMarketplace && !isLoggedInCloud && canManageApps && isAdminSection && (
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
					{Boolean(isDevelopmentMode) && canManageApps && isAdminSection && (
						<Button primary onClick={handleUploadButtonClick}>
							<Icon size='x20' name='upload' /> {t('Upload_app')}
						</Button>
					)}
				</ButtonGroup>
			</Page.Header>
			<Tabs>
				<Tabs.Item onClick={handleMarketplaceTabClick} selected={isMarketplace}>
					{t('Marketplace')}
				</Tabs.Item>
				<Tabs.Item onClick={handleInstalledTabClick} selected={!isMarketplace}>
					{t('Installed')}
				</Tabs.Item>
			</Tabs>
			<Page.Content overflowY='auto'>
				<AppsPageContent isMarketplace={isMarketplace} isAdminSection={isAdminSection} currentRouteName={currentRouteName} />
			</Page.Content>
		</Page>
	);
};

export default AppsPage;
