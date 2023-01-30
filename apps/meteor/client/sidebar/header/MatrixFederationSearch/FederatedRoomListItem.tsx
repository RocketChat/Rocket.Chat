import { Box, Button, Icon } from '@rocket.chat/fuselage';
import type { IFederationPublicRooms } from '@rocket.chat/rest-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { VFC } from 'react';
import React from 'react';

type FederatedRoomListItemProps = IFederationPublicRooms & {
	disabled: boolean;
	onClickJoin: () => void;
};

const FederatedRoomListItem: VFC<FederatedRoomListItemProps> = ({ name, topic, canonicalAlias, joinedMembers, onClickJoin, disabled }) => {
	const t = useTranslation();

	return (
		<Box mb='x16' is='li' display='flex' flexDirection='column' w='full' name={canonicalAlias}>
			<Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' mbe='x4'>
				<Box flexGrow={1} flexShrink={1} fontScale='p1' fontWeight='bold' title={name} withTruncatedText>
					{name}
				</Box>
				<Button primary flexShrink={0} onClick={onClickJoin} disabled={disabled} small>
					{t('Join')}
				</Button>
			</Box>

			{topic && (
				<Box is='p' fontScale='c1' mb='x4' maxHeight='x120' overflow='hidden'>
					{topic}
				</Box>
			)}

			<Box mbs='x4' fontScale='micro' fontWeight='bolder' verticalAlign='top'>
				{canonicalAlias}{' '}
				<Box color='hint' is='span' verticalAlign='top'>
					<Icon name='user' size='x12' mbe='x1' />
					{joinedMembers}
				</Box>
			</Box>
		</Box>
	);
};

export default FederatedRoomListItem;
