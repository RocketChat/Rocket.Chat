import React from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useStarredMessages } from './hooks/useStarredMessages';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { EmptyStarredMessages } from './components/EmptyStarredMessages';
import { StarredMessagesList } from './components/StarredMessagesList';
import VerticalBar from '../../../../components/VerticalBar';

export const StarredMessages = ({
	handleClose,
	handleStarredMessages,
}) => {
	const t = useTranslation();

	const content = handleStarredMessages.messages.length ? <StarredMessagesList /> : <EmptyStarredMessages />;

	return <>
		<VerticalBar.Header>
			<VerticalBar.Icon name='star'/>
			<VerticalBar.Text>{ t('Starred_messages') }</VerticalBar.Text>
			{handleClose && <VerticalBar.Close onClick={handleClose}/>}
		</VerticalBar.Header>
		<VerticalBar.ScrollableContent>
			{content}
		</VerticalBar.ScrollableContent>
	</>;
};

export default React.memo(({ tabBar, rid }) => {
	const handleClose = useMutableCallback(() => tabBar && tabBar.close());
	const staredMessages = useStarredMessages(rid);

	staredMessages.loadData();

	return <StarredMessages
		handleClose={handleClose}
		handleStarredMessages={staredMessages}
	/>;
});
