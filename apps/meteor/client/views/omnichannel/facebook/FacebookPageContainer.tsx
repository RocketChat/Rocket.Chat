import { Callout } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { ReactElement } from 'react';

import Page from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import FacebookPage from './FacebookPage';

type PageItem = {
	name: string;
	subscribed: boolean;
	id: string;
};

type PageData = {
	pages: PageItem[];
};

type InitialStateData = {
	enabled: boolean;
	hasToken: boolean;
};

const FacebookPageContainer = (): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const livechatFacebook = useMethod('livechat:facebook');

	const initialStateResult = useQuery(
		['omnichannel/facebook/initial-state'],
		async () => livechatFacebook({ action: 'initialState' }) as unknown as Promise<InitialStateData>,
		{
			initialData: { enabled: false, hasToken: false },
		},
	);

	const listPagesResult = useQuery(
		['omnichannel/facebook/list-pages'],
		async () => livechatFacebook({ action: 'list-pages' }) as unknown as Promise<PageData>,
		{
			initialData: { pages: [] },
		},
	);

	const { enabled, hasToken } = initialStateResult.data ?? { enabled: false, hasToken: false };
	const { pages } = listPagesResult.data ?? { pages: [] };

	const onToggle = useMutableCallback(async (id, isSubscribed, setSubscribed) => {
		setSubscribed(!isSubscribed);
		try {
			const action = isSubscribed ? 'unsubscribe' : 'subscribe';
			await livechatFacebook({
				action,
				page: id,
			});
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
			setSubscribed(isSubscribed);
		}
	});

	const onDisable = useMutableCallback(async () => {
		try {
			await livechatFacebook({ action: 'disable' });
			dispatchToastMessage({ type: 'success', message: t('Integration_disabled') });
			initialStateResult.refetch();
			listPagesResult.refetch();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const openOauthWindow = (url: string, callback: () => void): void => {
		const oauthWindow = window.open(url, 'facebook-integration-oauth', 'width=600,height=400');
		const checkInterval = setInterval(() => {
			if (oauthWindow?.closed) {
				clearInterval(checkInterval);
				callback();
			}
		}, 300);
	};

	const onEnable = useMutableCallback(async () => {
		try {
			const result = await livechatFacebook({ action: 'enable' });
			if (result && 'url' in result) {
				openOauthWindow(result.url, () => {
					onEnable();
				});
			} else {
				initialStateResult.refetch();
				listPagesResult.refetch();
			}
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	if (initialStateResult.isLoading || listPagesResult.isLoading) {
		return <PageSkeleton />;
	}

	if (initialStateResult.isError) {
		return (
			<Page>
				<Page.Header title={t('Edit_Custom_Field')} />
				<Page.ScrollableContentWithShadow>
					<Callout type='danger'>{t('Error')}</Callout>
				</Page.ScrollableContentWithShadow>
			</Page>
		);
	}

	if (enabled && hasToken && listPagesResult.isError) {
		onEnable();
	}

	return (
		<FacebookPage
			pages={pages}
			enabled={enabled}
			hasToken={hasToken}
			onToggle={onToggle}
			onRefresh={listPagesResult.refetch}
			onDisable={onDisable}
			onEnable={onEnable}
		/>
	);
};

export default FacebookPageContainer;
