import { Button, ButtonGroup, Icon, Skeleton, Tabs } from '@rocket.chat/fuselage';
import React, { useEffect, useState, ReactElement } from 'react';

import Page from '../../../components/Page';
import { useRoute } from '../../../contexts/RouterContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import AppsTable from './AppsTable';

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
		<Page>
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
				<Tabs.Item onClick={(): void => marketplaceRoute.push({ context: '' })} selected={isMarketplace}>
					{t('Marketplace')}
				</Tabs.Item>
				<Tabs.Item onClick={(): void => marketplaceRoute.push({ context: 'installed' })} selected={!isMarketplace}>
					{t('Installed')}
				</Tabs.Item>
			</Tabs>
			<Page.Content>
				<AppsTable isMarketplace={isMarketplace} />
			</Page.Content>
		</Page>
	);
};

export default AppsPage;
