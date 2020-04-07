import React, { useState } from 'react';
import { Avatar, Box, Tabs, Table } from '@rocket.chat/fuselage';

import { Page } from '../../basic/Page';
import { useTranslation } from '../../../contexts/TranslationContext';
import { UsersTab } from './UsersTab';
import { RoomsTab } from './RoomsTab';

export function UsersAndRooms(props) {
	const t = useTranslation();
	const [tab, setTab] = useState('users');
	return <Avatar.Context.Provider value={{ baseUrl: '/avatar/' }}>
		<Page {...props}>
			<Page.Header title={t('Users_and_rooms')} />
			<Tabs>
				<Tabs.Item selected={tab === 'users'} onClick={() => setTab('users') }>{t('Users')}</Tabs.Item>
				<Tabs.Item selected={tab === 'rooms'} onClick={() => setTab('rooms') }>{t('Rooms')}</Tabs.Item>
			</Tabs>
			<Page.Content>
				<Box mi='x24'>
					{
						(tab === 'users' && <UsersTab />)
						|| (tab === 'rooms' && <RoomsTab />)
					}
				</Box>
			</Page.Content>
		</Page>
	</Avatar.Context.Provider>;
}

export function GenericTable() {
	return <Table>
		<Table.Header>

		</Table.Header>
	</Table>;
}
