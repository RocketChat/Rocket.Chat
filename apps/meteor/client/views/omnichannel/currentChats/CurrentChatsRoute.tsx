import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { usePermission, useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import type { ReactElement } from 'react';

import CurrentChatsPage from './CurrentChatsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import Chat from '../directory/chats/Chat';

const CurrentChatsRoute = (): ReactElement => {
	const id = useRouteParameter('id');

	const canViewCurrentChats = usePermission('view-livechat-current-chats');
	const router = useRouter();

	const onRowClick = useEffectEvent((_id: string) => {
		router.navigate(`/omnichannel/current/${_id}`);
	});

	if (!canViewCurrentChats) {
		return <NotAuthorizedPage />;
	}

	if (id && id !== 'custom-fields') {
		return <Chat rid={id} />;
	}

	// TODO: Missing error state
	return <CurrentChatsPage onRowClick={onRowClick} id={id} />;
};

export default memo(CurrentChatsRoute);
