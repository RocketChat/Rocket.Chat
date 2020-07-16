import React from 'react';
import { Box, Tag, Divider } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import Emoji from '../../../../client/components/basic/Emoji';

export function Reactions(props) {
	const styleDivider = {
		marginTop: '8px',
		marginBottom: '16px',
	};

	const reactionKeys = useMemo(() => Object.keys(props.reactions), [props.reactions]);

	return <Box>
		{
			reactionKeys.map((reaction, i) => <Box key={reaction}><div style={{ display: 'flex' }}><Emoji emojiHandle={reaction}/> {reaction}</div>
				<Usernames usernames={props.reactions[reaction].usernames}></Usernames> { i !== (reactionKeys.length - 1) && <Divider key={reaction} style={styleDivider}/> } </Box>)
		}
	</Box>;
}

export function Usernames(props) {
	const styleBox = {
		paddingTop: '8px',
	};

	const styleTag = {
		marginRight: '4px',
	};

	return <Box style={styleBox}>
		{ props.usernames.map((user) => <Tag style={styleTag} key={user}>{user}</Tag>)}
	</Box>;
}

export default function ReactionListContent(props) {
	const t = useTranslation();

	const style = {
		overflow: 'auto',
		maxHeight: '450px',
	};

	const { reactions } = props.data;

	return <Box style={style}>
		<Box is='h2' fontScale='h1' mb='x8'>{t('Users_reacted')}</Box>
		<Reactions reactions={reactions} />
	</Box>;
}
