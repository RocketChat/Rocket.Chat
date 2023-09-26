import type { ISetting, Serialized, SettingValue } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint, usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import Page from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import WebhooksPage from './WebhooksPage';

const reduceSettings = (settings: Serialized<ISetting>[]) =>
	settings.reduce<Record<string, SettingValue>>((acc, { _id, value }) => {
		acc = { ...acc, [_id]: value };
		return acc;
	}, {});

const WebhooksPageContainer = () => {
	const t = useTranslation();

	const getIntegrationsSettings = useEndpoint('GET', '/v1/livechat/integrations.settings');

	const { data, isLoading, isError } = useQuery(['/v1/livechat/integrations.settings'], async () => {
		const { settings, success } = await getIntegrationsSettings();
		return { settings: reduceSettings(settings), success };
	});

	const canViewLivechatWebhooks = usePermission('view-livechat-webhooks');

	if (!canViewLivechatWebhooks) {
		return <NotAuthorizedPage />;
	}

	if (isLoading) {
		return <PageSkeleton />;
	}

	if (!data?.success || !data?.settings || isError) {
		return (
			<Page>
				<Page.Header title={t('Webhooks')} />
				<Page.ScrollableContentWithShadow>
					<Callout type='danger'>{t('Error')}</Callout>
				</Page.ScrollableContentWithShadow>
			</Page>
		);
	}

	return <WebhooksPage settings={data.settings} />;
};

export default WebhooksPageContainer;
