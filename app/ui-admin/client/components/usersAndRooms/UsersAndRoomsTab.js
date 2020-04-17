import React, { useCallback } from 'react';
import { Tabs, ButtonGroup, Button, Icon, Box } from '@rocket.chat/fuselage';

import { Page } from '../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useRouteParameter, useRoute } from '../../../../../client/contexts/RouterContext';
import { useMediaQuery } from '../../../../ui/client/views/app/components/hooks';
import { EditRoom } from '../rooms/edit/EditRoom';

export function UsersAndRoomsTab({ route, tab, children, switchTab, ...props }) {
	const t = useTranslation();

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const mobile = useMediaQuery('(max-width: 420px)');
	const small = useMediaQuery('(max-width: 780px)');

	const router = useRoute(route);
	const handleNew = useCallback(() => router.push({
		context: 'new',
	}), [router]);

	return <Page {...props} flexDirection='row'>
		<Page name='admin-user-and-room'>
			<Page.Header title={t('Users_and_rooms')}>
				{ tab === 'users' && <ButtonGroup>
					<Button small onClick={handleNew} aria-label={t('New')}>
						<Icon name='plus' />
					</Button>
				</ButtonGroup>
				}
			</Page.Header>
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
				<Page.VerticalBar.Header>{t('Room_Info')} <Page.VerticalBar.Close onClick={() => {
					router.push({});
				}}/></Page.VerticalBar.Header>
				<Page.VerticalBar.Content>
					<EditRoom roomId={id}/>
				</Page.VerticalBar.Content>
			</Page.VerticalBar>}
	</Page>;
}
