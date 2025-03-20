import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Icon } from '@rocket.chat/fuselage';
import type { IFederationPublicRooms } from '@rocket.chat/rest-typings';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

type FederatedRoomListItemProps = IFederationPublicRooms & {
	disabled: boolean;
	onClickJoin: () => void;
};

const clampLine = css`
	line-clamp: 6;
`;

const FederatedRoomListItem = ({
	name,
	topic,
	canonicalAlias,
	joinedMembers,
	onClickJoin,
	canJoin,
	disabled,
}: FederatedRoomListItemProps) => {
	const { t } = useTranslation();
	const nameId = useId();

	return (
		<Box mb={16} pi={24} is='li' display='flex' flexDirection='column' w='full' name={canonicalAlias} aria-labelledby={nameId}>
			<Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' mbe={4}>
				<Box flexGrow={1} flexShrink={1} fontScale='p1' fontWeight='bold' title={name} withTruncatedText id={nameId}>
					{name}
				</Box>
				{canJoin && (
					<Button primary flexShrink={0} onClick={onClickJoin} disabled={disabled} small>
						{t('Join')}
					</Button>
				)}
				{/* Currently canJoin is only false when the ammount of members is too big. This property will be used in the future
					in case the matrix room is knock only. When that happens, the check for this should be based on the limit setting. */}
				{!canJoin && (
					<Box flexShrink={0} color='danger' title={t('Currently_we_dont_support_joining_servers_with_this_many_people')}>
						{t('Cant_join')}
					</Box>
				)}
			</Box>

			{topic && (
				<Box is='p' fontScale='c1' mb={4} maxHeight='x120' overflow='hidden' withTruncatedText className={[clampLine]}>
					{topic}
				</Box>
			)}

			<Box mbs={4} fontScale='micro' fontWeight='bolder' verticalAlign='top'>
				{canonicalAlias}{' '}
				<Box color='hint' is='span' verticalAlign='top'>
					<Icon name='user' size='x12' mbe={2} />
					{joinedMembers}
				</Box>
			</Box>
		</Box>
	);
};

export default FederatedRoomListItem;
