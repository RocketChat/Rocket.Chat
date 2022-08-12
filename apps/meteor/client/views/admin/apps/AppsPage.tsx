import { Button, ButtonGroup, Icon, Skeleton, Tabs } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useRoute, useSetting, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect, useState, ReactElement } from 'react';

import Page from '../../../components/Page';
import AppsPageContent from './AppsPageContent';

type AppsPageProps = {
	isMarketplace: boolean;
};

const AppsPage = ({ isMarketplace }: AppsPageProps): ReactElement => {
	const t = useTranslation();

	const isDevelopmentMode = useSetting('Apps_Framework_Development_Mode');
	const marketplaceRoute = useRoute('admin-marketplace');
	const appsRoute = useRoute('admin-apps');
	const cloudRoute = useRoute('cloud');
	const checkUserLoggedIn = useMethod('cloud:checkUserLoggedIn');

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
		appsRoute.push({ context: 'install' });
	};

	return (
		<Page backgroundColor={colors.n100}>
			<Page.Header title={t('Apps')} bg={colors.n100}>
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
			<Tabs bg={colors.n100} borderBlockEnd='4px solid #CBCED1' marginInline='x24'>
				<Tabs.Item
					onClick={(): void => marketplaceRoute.push({ context: '' })}
					selected={isMarketplace}
					mbe='neg-x4'
					mis='neg-x12'
					borderWidth='0'
					borderBlockWidth='x4'
				>
					{t('Marketplace')}
				</Tabs.Item>
				<Tabs.Item
					onClick={(): void => marketplaceRoute.push({ context: 'installed' })}
					selected={!isMarketplace}
					mbe='neg-x4'
					borderWidth='0'
					borderBlockWidth='x4'
				>
					{t('Installed')}
				</Tabs.Item>
			</Tabs>
			<Page.Content bg={colors.n100} overflowY='auto'>
				<AppsPageContent isMarketplace={isMarketplace} />
			</Page.Content>
		</Page>
	);
};

export default AppsPage;
