import { Button, ButtonGroup, Icon, Skeleton } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRoute, useTranslation, useCurrentRoute, useRouteParameter, usePermission, useMethod } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useState } from 'react';

import Page from '../../../components/Page';
import AppsPageContent from './AppsPageContent';

type AppsPageProps = {
	isMarketplace: boolean;
};

const AppsPage = ({ isMarketplace }: AppsPageProps): ReactElement => {
	const t = useTranslation();

	const cloudRoute = useRoute('cloud');
	const checkUserLoggedIn = useMethod('cloud:checkUserLoggedIn');
	const isAdminUser = usePermission('manage-apps');

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
		if (isAdminUser) initialize();
	}, [checkUserLoggedIn, isAdminUser]);

	const handleLoginButtonClick = (): void => {
		cloudRoute.push();
	};

	const handleUploadButtonClick = (): void => {
		context && router.push({ context, page: 'install' });
	};

	const AppsTitles: { [key: string]: string } = {
		explore: 'Explore',
		installed: 'Installed',
		enterprise: 'Enterprise',
		requested: 'Requested',
		private: 'Private apps',
	};

	return (
		<Page background='tint'>
			<Page.Header title={context && t(AppsTitles[context] as TranslationKey)}>
				<ButtonGroup>
					{isMarketplace && !isLoggedInCloud && isAdminUser && (
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
					{isAdminUser && context === 'private' && (
						<Button primary onClick={handleUploadButtonClick}>
							<Icon size='x20' name='upload' /> {t('Upload_app')}
						</Button>
					)}
				</ButtonGroup>
			</Page.Header>
			<Page.Content paddingInline='0'>
				<AppsPageContent />
			</Page.Content>
		</Page>
	);
};

export default AppsPage;
