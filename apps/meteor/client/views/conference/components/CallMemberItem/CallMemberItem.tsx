import { isRingingVideoConferenceMember } from '@rocket.chat/core-typings';
import { Box, Icon, IconButton, Option, OptionAvatar, OptionColumn, OptionContent } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { getUserDisplayNames } from '../../../../../lib/getUserDisplayNames';
import type { ConferenceMemberStatus } from '../../../../../lib/videoConference/memberStatus';
import { canRingConferenceMember, getConferenceMemberStatus } from '../../../../../lib/videoConference/memberStatus';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
import { useRingingExpiry } from '../../../../hooks/useRingingExpiry';
import type { ConferenceMember } from '../../hooks/useConferenceEmbedded';

type CallMemberItemProps = {
	member: ConferenceMember;
	hasChatAccess: boolean;
	onRing: (memberId: string) => void;
};

const statusLabel: Record<Exclude<ConferenceMemberStatus, 'joined'>, string> = {
	left: 'Left',
	declined: 'Declined',
	invited: 'Waiting_for_answer',
};

const CallMemberItem = ({ member, hasChatAccess, onRing }: CallMemberItemProps) => {
	const { t } = useTranslation();
	const useRealName = useSetting('UI_Use_Real_Name', false);
	const [nameOrUsername, displayUsername] = getUserDisplayNames(member.name, member.username, useRealName);
	const status = getConferenceMemberStatus(member);

	const ringing = isRingingVideoConferenceMember(member);
	useRingingExpiry([ringing ? member.ringingAt : undefined]);

	return (
		<Option>
			<OptionAvatar>
				<UserAvatar username={member.username} size='x28' />
			</OptionAvatar>
			<OptionColumn>
				<ReactiveUserStatus uid={member._id} />
			</OptionColumn>
			<OptionContent>
				<Box display='flex' alignItems='center'>
					<Box withTruncatedText>{nameOrUsername}</Box>
					{displayUsername && (
						<Box marginInlineStart={4} color='hint' withTruncatedText>
							{displayUsername}
						</Box>
					)}
					{!hasChatAccess && (
						<Box marginInlineStart={4} display='flex' color='hint' title={t('No_chat_access')}>
							<Icon name='balloon-off' size='x16' aria-label={t('No_chat_access')} />
						</Box>
					)}
				</Box>
				{status !== 'joined' && (
					<Box fontScale='c1' color='hint'>
						{t(ringing ? 'Ringing' : statusLabel[status])}
					</Box>
				)}
			</OptionContent>
			{canRingConferenceMember(member) && (
				<OptionColumn>
					<IconButton
						small
						icon='phone'
						title={t('Ring__name__', { name: nameOrUsername })}
						aria-label={t('Ring__name__', { name: nameOrUsername })}
						onClick={() => onRing(member._id)}
					/>
				</OptionColumn>
			)}
		</Option>
	);
};

export default CallMemberItem;
