import { Icon, Box } from '@rocket.chat/fuselage';
import React from 'react';

import VerticalBar from '../../../../../components/VerticalBar';
import { useRoute } from '../../../../../contexts/RouterContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { ChatInfo } from './ChatInfo';

const PATH = 'live';

const ChatsContextualBar = ({ rid }) => {
	const t = useTranslation();

	const directoryRoute = useRoute(PATH);

	const closeContextualBar = () => {
		directoryRoute.push({ id: rid });
	};

	return (
		<>
			<VerticalBar.Header>
				<Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'>
					<Icon name='info-circled' size='x20' /> {t('Room_Info')}
				</Box>
				<VerticalBar.Close onClick={closeContextualBar} />
			</VerticalBar.Header>
			<ChatInfo route={PATH} id={rid} />
		</>
	);
};

export default ChatsContextualBar;
