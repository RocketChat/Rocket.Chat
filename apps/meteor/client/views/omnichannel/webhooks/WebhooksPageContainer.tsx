import type { ISetting, Serialized, SettingValue } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import WebhooksPage from './WebhooksPage';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const reduceSettings = (settings: Serialized<ISetting>[]) =>
	settings.reduce<Record<string, SettingValue>>((acc, { _id, value }) => {
		acc = { ...acc, [_id]: value };
		return acc;
	}, {});

const WebhooksPageContainer = () => {
	const { t } = useTranslation();

	const getIntegrationsSettings = useEndpoint('GET', '/v1/livechat/integrations.settings');

	const { data, isPending, isError } = useQuery({
		queryKey: ['/v1/livechat/integrations.settings'],

		queryFn: async () => {
			const { settings, success } = await getIntegrationsSettings();
			return { settings: reduceSettings(settings), success };
		},
	});

	const canViewLivechatWebhooks = usePermission('view-livechat-webhooks');

	if (!canViewLivechatWebhooks) {
		return <NotAuthorizedPage />;
	}

	if (isPending) {
		return <PageSkeleton />;
	}

	if (!data?.success || !data?.settings || isError) {
		return (
			<Page>
				<PageHeader title={t('Webhooks')} />
				<PageScrollableContentWithShadow>
					<Callout type='danger'>{t('Error')}</Callout>
				</PageScrollableContentWithShadow>
			</Page>
		);
	}

	return <WebhooksPage settings={data.settings} />;
};

export default WebhooksPageContainer;
