import React, { FC, useState, Dispatch } from 'react';
import { Box, Button, ButtonGroup, Field, FieldGroup, ToggleSwitch, BoxClassName, Callout, Divider } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import Page from '../../components/basic/Page';
import PageSkeleton from '../../components/PageSkeleton';
import { useTranslation } from '../../contexts/TranslationContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useMethodData, AsyncState, useMethod } from '../../contexts/ServerContext';

type OnToggleProps = { onToggle: (id: string, isSubscribed: boolean, setSubscribed: Dispatch<boolean>) => void };

type PageItem = {
	name: string;
	subscribed: boolean;
	id: string;
};

type FacebookPageProps = OnToggleProps & {
	enabled: boolean;
	hasToken: boolean;
	pages: PageItem[];
	onRefresh: () => void;
	onDisable: () => void;
	onEnable: () => void;
};

type PageToggleAssemblerProps = OnToggleProps & {
	pages: PageItem[];
	className?: BoxClassName;
};

type PageToggleProps = OnToggleProps & PageItem & {
	className?: BoxClassName;
};

type PageData = {
	pages: PageItem[];
};

type InitialStateData = {
	enabled: boolean;
	hasToken: boolean;
}

const initialStateArgs = [{
	action: 'initialState',
}];

const listPageArgs = [{
	action: 'list-pages',
}];

const FacebookPageContainer: FC = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [initialStateData, state, reloadInitial] = useMethodData<InitialStateData>('livechat:facebook', initialStateArgs);

	const [pagesData, listState, reloadData] = useMethodData<PageData>('livechat:facebook', listPageArgs);

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

	if (state === AsyncState.LOADING || listState === AsyncState.LOADING) {
		return <PageSkeleton />;
	}

	if (state === AsyncState.ERROR) {
		return <Page>
			<Page.Header title={t('Edit_Custom_Field')} />
			<Page.ScrollableContentWithShadow>
				<Callout type='danger'>
					{t('Error')}
				</Callout>
			</Page.ScrollableContentWithShadow>
		</Page>;
	}

	if (enabled && hasToken && listState === AsyncState.ERROR) {
		onEnable();
	}

	return <FacebookPage
		pages={pages}
		enabled={enabled}
		hasToken={hasToken}
		onToggle={onToggle}
		onRefresh={reloadData}
		onDisable={onDisable}
		onEnable={onEnable}
	/>;
};

const PageToggle: FC<PageToggleProps> = ({ name, id, subscribed, onToggle, className }) => {
	const [isSubscribed, setIsSubscribed] = useState(subscribed);
	const handleToggle = useMutableCallback(() => onToggle(id, isSubscribed, setIsSubscribed));
	return <Field className={className}>
		<Box display='flex' flexDirection='row'>
			<Field.Label>{name}</Field.Label>
			<Field.Row>
				<ToggleSwitch checked={isSubscribed} onChange={handleToggle}/>
			</Field.Row>
		</Box>
	</Field>;
};

const PageToggleAssembler: FC<PageToggleAssemblerProps> = ({ pages, onToggle, className }) => <FieldGroup>
	{pages.map((page) => <PageToggle key={page.id} {...page} onToggle={onToggle} className={className}/>)}
</FieldGroup>;

const FacebookPage: FC<FacebookPageProps> = ({
	pages,
	enabled,
	hasToken,
	onToggle,
	onRefresh,
	onEnable,
	onDisable,
}) => {
	const t = useTranslation();

	return <Page>
		<Page.Header title={t('Facebook')}/>
		<Page.ScrollableContentWithShadow>
			<Box maxWidth='x600' w='full' alignSelf='center'>
				{!enabled && <>
					<ButtonGroup stretch mb='x8'>
						<Button primary onClick={onEnable} disabled={!hasToken}>
							{t('Enable')}
						</Button>
					</ButtonGroup>
					{!hasToken && <>
						<p>{t('You_have_to_set_an_API_token_first_in_order_to_use_the_integration')}</p>
						<p>{t('Please_go_to_the_Administration_page_then_Livechat_Facebook')}</p>
					</>}
				</>}
				{enabled && <>
					<Box fontScale='h1' mbe='x8'>{t('Pages')}</Box>
					{
						pages?.length
							? <FieldGroup>
								<PageToggleAssembler pages={pages} onToggle={onToggle}/>
							</FieldGroup>
							: t('No_pages_yet_Try_hitting_Reload_Pages_button')
					}
					<Box w='full' mb='x16'>
						<Divider />
					</Box>
					<ButtonGroup stretch vertical>
						<Button onClick={onRefresh}>
							{t('Reload_Pages')}
						</Button>
						<Button danger onClick={onDisable}>
							{t('Disable')}
						</Button>
					</ButtonGroup>
				</>}
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default FacebookPageContainer;
