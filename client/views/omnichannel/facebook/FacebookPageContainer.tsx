import { Callout } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FC } from 'react';

import Page from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import { useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useMethodData } from '../../../hooks/useMethodData';
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

const initialStateArgs = [
	{
		action: 'initialState',
	},
];

const listPageArgs = [
	{
		action: 'list-pages',
	},
];

const FacebookPageContainer: FC = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const {
		value: initialStateData,
		phase: state,
		reload: reloadInitial,
	} = useMethodData<InitialStateData>('livechat:facebook', initialStateArgs);

	const {
		value: pagesData,
		phase: listState,
		reload: reloadData,
	} = useMethodData<PageData>('livechat:facebook', listPageArgs);

	const { enabled, hasToken } = initialStateData || { enabled: false, hasToken: false };
	const { pages } = pagesData || { pages: [] };

	const livechatFacebook = useMethod('livechat:facebook');

	const onToggle = useMutableCallback(async (id, isSubscribed, setSubscribed) => {
		setSubscribed(!isSubscribed);
		try {
			const action = isSubscribed ? 'unsubscribe' : 'subscribe';
			await livechatFacebook({
				action,
				page: id,
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			setSubscribed(isSubscribed);
		}
	});

	const onDisable = useMutableCallback(async () => {
		try {
			await livechatFacebook({ action: 'disable' });
			dispatchToastMessage({ type: 'success', message: t('Integration_disabled') });
			reloadInitial();
			reloadData();
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
			if (result?.url) {
				openOauthWindow(result?.url, () => {
					onEnable();
				});
			} else {
				reloadInitial();
				reloadData();
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	if (state === AsyncStatePhase.LOADING || listState === AsyncStatePhase.LOADING) {
		return <PageSkeleton />;
	}

	if (state === AsyncStatePhase.REJECTED) {
		return (
			<Page>
				<Page.Header title={t('Edit_Custom_Field')} />
				<Page.ScrollableContentWithShadow>
					<Callout type='danger'>{t('Error')}</Callout>
				</Page.ScrollableContentWithShadow>
			</Page>
		);
	}

	if (enabled && hasToken && listState === AsyncStatePhase.REJECTED) {
		onEnable();
	}

	return (
		<FacebookPage
			pages={pages}
			enabled={enabled}
			hasToken={hasToken}
			onToggle={onToggle}
			onRefresh={reloadData}
			onDisable={onDisable}
			onEnable={onEnable}
		/>
	);
};

export default FacebookPageContainer;
