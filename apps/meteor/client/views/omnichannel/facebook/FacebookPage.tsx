import { Box, Button, ButtonGroup, FieldGroup, Divider } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, Dispatch } from 'react';

import Page from '../../../components/Page';
import PageToggleAssembler from './PageToggleAssembler';

type OnToggleProps = {
	onToggle: (id: string, isSubscribed: boolean, setSubscribed: Dispatch<boolean>) => void;
};

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

const FacebookPage: FC<FacebookPageProps> = ({ pages, enabled, hasToken, onToggle, onRefresh, onEnable, onDisable }) => {
	const t = useTranslation();

	return (
		<Page>
			<Page.Header title={t('Facebook')} />
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center'>
					{!enabled && (
						<>
							<ButtonGroup stretch mb='x8'>
								<Button primary onClick={onEnable} disabled={!hasToken}>
									{t('Enable')}
								</Button>
							</ButtonGroup>
							{!hasToken && (
								<>
									<p>{t('You_have_to_set_an_API_token_first_in_order_to_use_the_integration')}</p>
									<p>{t('Please_go_to_the_Administration_page_then_Livechat_Facebook')}</p>
								</>
							)}
						</>
					)}
					{enabled && (
						<>
							<Box fontScale='h2' mbe='x8'>
								{t('Pages')}
							</Box>
							{pages?.length ? (
								<FieldGroup>
									<PageToggleAssembler pages={pages} onToggle={onToggle} />
								</FieldGroup>
							) : (
								t('No_pages_yet_Try_hitting_Reload_Pages_button')
							)}
							<Box w='full' mb='x16'>
								<Divider />
							</Box>
							<ButtonGroup stretch vertical>
								<Button onClick={onRefresh}>{t('Reload_Pages')}</Button>
								<Button danger onClick={onDisable}>
									{t('Disable')}
								</Button>
							</ButtonGroup>
						</>
					)}
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default FacebookPage;
