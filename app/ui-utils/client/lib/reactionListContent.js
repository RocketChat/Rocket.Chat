import React, { useMemo } from 'react';
import { Box, Tag, Divider } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import Emoji from '../../../../client/components/basic/Emoji';

export function Reactions(props) {
	const reactionKeys = useMemo(() => Object.keys(props.reactions), [props.reactions]);

	return <Box overflowY='auto' maxHeight='x440'>
		{reactionKeys.map((reaction, i) => <Box key={reaction}>
			<Box display='flex'>
				<Emoji emojiHandle={reaction}/> {reaction}
			</Box>
			<Usernames usernames={props.reactions[reaction].usernames}></Usernames>
			{ i !== (reactionKeys.length - 1) && <Divider key={reaction} marginBlockStart='x8' marginBlockEnd='x16'/> }
		</Box>)}
	</Box>;
}

export function Usernames(props) {
	return <Box paddingBlockStart='8x'>
		{ props.usernames.map((user) => <Tag marginInlineEnd='4x' key={user}>{user}</Tag>)}
	</Box>;
}

export default function ReactionListContent(props) {
	const t = useTranslation();

	const { reactions } = props;

	return <Box>
		<Box is='h2' fontScale='h1' mb='x8'>{t('Users_reacted')}</Box>
		<Reactions reactions={reactions} />
	</Box>;
}
