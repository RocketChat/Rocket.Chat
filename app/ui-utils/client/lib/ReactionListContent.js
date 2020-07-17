import React, { useMemo } from 'react';
import { Box, Tag, Divider, Modal, Icon, ButtonGroup, Button, Scrollable } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import Emoji from '../../../../client/components/basic/Emoji';

export function Reactions(props) {
	const reactionKeys = useMemo(() => Object.keys(props.reactions), [props.reactions]);

	return <Scrollable>
		<Box>
			{reactionKeys.map((reaction, i) => <Box key={reaction}>
				<Box display='flex'>
					<Emoji emojiHandle={reaction}/> {reaction}
				</Box>
				<Usernames usernames={props.reactions[reaction].usernames}></Usernames>
				{ i !== (reactionKeys.length - 1) && <Divider key={reaction} marginBlockStart='x8' marginBlockEnd='x16'/> }
			</Box>)}
		</Box>
	</Scrollable>;
}

export function Usernames(props) {
	return <Box paddingBlock='x4'>
		{ props.usernames.map((user) => <Tag marginInlineEnd='4x' key={user}>{user}</Tag>)}
	</Box>;
}

export default function ReactionListContent({ reactions, onClose }) {
	const t = useTranslation();

	return <>
		<Modal.Header>
			<Icon name='emoji' size={20}/>
			<Modal.Title>{t('Reactions')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			<Reactions reactions={reactions} />
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</>;
}
