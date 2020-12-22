import React, { useEffect } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useStarredMessages } from './hooks/useStarredMessages';
import { useUser, useUserSubscription } from '../../../../contexts/UserContext';
import { useSetting } from '../../../../contexts/SettingsContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { LoadingStarredMessages } from './components/LoadingStarredMessages';
import { EmptyStarredMessages } from './components/EmptyStarredMessages';
import { StarredMessagesList } from './components/StarredMessagesList';
import VerticalBar from '../../../../components/VerticalBar';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';

export const StarredMessages = ({
	onClose,
	loadMore,
	messages,
	rid,
	subscription,
	settings,
	u,
}) => {
	const t = useTranslation();
	let content;

	if (Array.isArray(messages)) {
		content = messages.length > 0
			? <StarredMessagesList
				loadMore={loadMore}
				messages={messages}
				rid={rid}
				subscription={subscription}
				settings={settings}
				u={u}
			/>
			: <EmptyStarredMessages />;
	} else {
		content = <LoadingStarredMessages />;
	}

	return <>
		<VerticalBar.Header>
			<VerticalBar.Icon name='star'/>
			<VerticalBar.Text>{ t('Starred_Messages') }</VerticalBar.Text>
			{onClose && <VerticalBar.Close onClick={onClose}/>}
		</VerticalBar.Header>
		<VerticalBar.Content p='x0'>
			{content}
		</VerticalBar.Content>
	</>;
};

export default React.memo(({ tabBar, rid }) => {
	const onClose = useMutableCallback(() => tabBar && tabBar.close());
	const { messages, error, loadMore } = useStarredMessages(rid);
	const dispatchToastMessage = useToastMessageDispatch();
	const subscription = useUserSubscription(rid);
	const settings = {
		AutoTranslate_Enabled: useSetting('AutoTranslate_Enabled'),
		Chatops_Username: useSetting('Chatops_Username'),
	};
	const u = useUser();

	useEffect(() => {
		if (error) {
			dispatchToastMessage({
				type: 'error',
				message: error,
			});
		}
	}, [dispatchToastMessage, error]);

	return <StarredMessages
		onClose={onClose}
		loadMore={loadMore}
		messages={messages}
		rid={rid}
		subscription={subscription}
		settings={settings}
		u={u}
	/>;
});
