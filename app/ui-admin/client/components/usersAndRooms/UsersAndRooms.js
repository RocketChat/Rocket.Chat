import React from 'react';
import { Avatar, Box, Tabs } from '@rocket.chat/fuselage';

import { Page } from '../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';

export function UsersAndRooms({ tab, children, switchTab = () => {}, ...props }) {
	const t = useTranslation();
	return <Avatar.Context.Provider value={{ baseUrl: '/avatar/' }}>
		<Page {...props}>
			<Page.Header title={t('Users_and_rooms')} />
			<Tabs>
				<Tabs.Item selected={tab === 'users'} onClick={switchTab('users')}>{t('Users')}</Tabs.Item>
				<Tabs.Item selected={tab === 'rooms'} onClick={switchTab('rooms')}>{t('Rooms')}</Tabs.Item>
			</Tabs>
			<Page.Content>
				<Box mi='x24'>
					{children}
				</Box>
			</Page.Content>
		</Page>
	</Avatar.Context.Provider>;
}
