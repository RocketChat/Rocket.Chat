import { Box, Button, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { VFC } from 'react';
import React from 'react';

type FederatedRoomListItemProps = {
	name: string;
	canJoin: boolean;
	canonicalAlias: string;
	joinedMembers: number;
	topic?: string;
	disabled: boolean;
	onClickJoin: () => void;
};

const FederatedRoomListItem: VFC<FederatedRoomListItemProps> = ({ name, topic, canonicalAlias, joinedMembers, onClickJoin, disabled }) => {
	const t = useTranslation();

	return (
		<Box mb='x16' is='li' display='flex' flexDirection='column' w='full' name={canonicalAlias}>
			<Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' mbe='x4'>
				<Box fontScale='p1' fontWeight='bold' title={name}>
					{name}
				</Box>
				<Button primary onClick={onClickJoin} disabled={disabled} small>
					{t('Join')}
				</Button>
			</Box>

			{topic && (
				<Box is='p' fontScale='c1' mb='x4' maxHeight='x120'>
					{topic}
				</Box>
			)}

			<Box mbs='x4' fontScale='micro' fontWeight='bolder' verticalAlign='center'>
				{canonicalAlias}{' '}
				<Box color='hint' is='span'>
					<Icon name='user' size='x12' />
					{joinedMembers}
				</Box>
			</Box>
		</Box>
	);
};

export default FederatedRoomListItem;
