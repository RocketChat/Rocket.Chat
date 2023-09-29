import { Callout, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import Page from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import ManageSubscriptionPage from './ManageSubscriptionPage';

const ManageSubscriptionRoute = (): ReactElement => {
	const t = useTranslation();
	const canViewManageSubscription = usePermission('manage-cloud');
	const isLoading = false;
	const error = false;

	const handleClickRefreshButton = (): void => {
		if (isLoading) {
			return;
		}

		console.log('handleClickRefreshButton');
	};

	if (isLoading) {
		return <PageSkeleton />;
	}

	if (error) {
		return (
			<Page>
				<Page.Header title={t('Manage_subscription')}>
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

	if (canViewManageSubscription) {
		return <ManageSubscriptionPage />;
	}

	return <NotAuthorizedPage />;
};

export default memo(ManageSubscriptionRoute);
