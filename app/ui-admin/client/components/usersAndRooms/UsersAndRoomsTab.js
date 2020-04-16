import React from 'react';
import { Tabs } from '@rocket.chat/fuselage';

import { Page } from '../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useRouteParameter, useRoute } from '../../../../../client/contexts/RouterContext';
import { useMediaQuery } from '../../../../ui/client/views/app/components/hooks';

export function UsersAndRoomsTab({ route, tab, children, switchTab, ...props }) {
	const t = useTranslation();

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const mobile = useMediaQuery('(max-width: 420px)');
	const small = useMediaQuery('(max-width: 780px)');


	const router = useRoute(route);

	return <Page {...props} flexDirection='row'>
		<Page name='admin-user-and-room'>
			<Page.Header title={t('Users_and_rooms')} />
			<Tabs>
				<Tabs.Item selected={tab === 'users'} onClick={switchTab && switchTab.users}>{t('Users')}</Tabs.Item>
				<Tabs.Item selected={tab === 'rooms'} onClick={switchTab && switchTab.rooms}>{t('Rooms')}</Tabs.Item>
			</Tabs>
			<Page.Content>
				{children}
			</Page.Content>
		</Page>
		{ context
			&& <Page.VerticalBar mod-small={small} mod-mobile={mobile} style={{ width: '378px' }} qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
				<Page.VerticalBar.Header>{id} <Page.VerticalBar.Close onClick={() => {
					router.push({});
				}}/></Page.VerticalBar.Header>
				<Page.VerticalBar.Content></Page.VerticalBar.Content>
			</Page.VerticalBar>}
	</Page>;
}
