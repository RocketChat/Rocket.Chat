import { Callout } from '@rocket.chat/fuselage';
import { usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Page from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import WebhooksPage from './WebhooksPage';

const reduceSettings = (settings) =>
	settings.reduce((acc, { _id, value }) => {
		acc = { ...acc, [_id]: value };
		return acc;
	}, {});

const WebhooksPageContainer = () => {
	const t = useTranslation();

	const { value: data, phase: state, error } = useEndpointData('livechat/integrations.settings');

	const canViewLivechatWebhooks = usePermission('view-livechat-webhooks');

	if (!canViewLivechatWebhooks) {
		return <NotAuthorizedPage />;
	}

	if (state === AsyncStatePhase.LOADING) {
		return <PageSkeleton />;
	}

	if (!data || !data.success || !data.settings || error) {
		return (
			<Page>
				<Page.Header title={t('Webhooks')} />
				<Page.ScrollableContentWithShadow>
					<Callout type='danger'>{t('Error')}</Callout>
				</Page.ScrollableContentWithShadow>
			</Page>
		);
	}

	return <WebhooksPage settings={reduceSettings(data.settings)} />;
};

export default WebhooksPageContainer;
