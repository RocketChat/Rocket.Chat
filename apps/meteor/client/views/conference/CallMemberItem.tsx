import { isRingingVideoConferenceMember } from '@rocket.chat/core-typings';
import { Box, Icon, IconButton, Option, OptionAvatar, OptionColumn, OptionContent } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { ConferenceMember } from './hooks/useCallOutcome';
import { getUserDisplayNames } from '../../../lib/getUserDisplayNames';
import type { ConferenceMemberStatus } from '../../../lib/videoConference/memberStatus';
import { canRingConferenceMember, getConferenceMemberStatus } from '../../../lib/videoConference/memberStatus';
import { ReactiveUserStatus } from '../../components/UserStatus';
import { useRingingExpiry } from '../../hooks/useRingingExpiry';

type CallMemberItemProps = {
	member: ConferenceMember;
	/** Membership grants no room access, so a member can be in the call and unable to read its chat. */
	hasChatAccess: boolean;
	onRing: (memberId: string) => void;
};

/** Only shown for members who aren't in the call — for those, presence in the call is the whole story. */
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

	// So the "ring again" button comes back the moment this ring lapses, rather than on the next unrelated change.
	useRingingExpiry([ringing ? member.ringingAt : undefined]);

	return (
		<Option>
			<OptionAvatar>
				<UserAvatar username={member.username} size='x28' />
			</OptionAvatar>
			{status === 'joined' && (
				<OptionColumn>
					<ReactiveUserStatus uid={member._id} />
				</OptionColumn>
			)}
			<OptionContent>
				<Box display='flex' alignItems='center'>
					<Box withTruncatedText>{nameOrUsername}</Box>
					{displayUsername && (
						<Box marginInlineStart={4} color='hint' withTruncatedText>
							{displayUsername}
						</Box>
					)}
					{/* Beside the name rather than beneath it: it qualifies who this person is in the call, and a
					    second line pushed the rows apart for something most members never carry. */}
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
