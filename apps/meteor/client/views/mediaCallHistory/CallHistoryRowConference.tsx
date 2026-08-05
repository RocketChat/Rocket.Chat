import type { CallHistoryItemState } from '@rocket.chat/core-typings';
import { Box, Button, FramedIcon, Icon } from '@rocket.chat/fuselage';
import { GenericMenu, GenericTableCell, GenericTableRow } from '@rocket.chat/ui-client';
import { useLanguage } from '@rocket.chat/ui-contexts';
import { intlFormatDistance } from 'date-fns';
import type { TFunction } from 'i18next';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useGoToRoom } from '../room/hooks/useGoToRoom';

export type CallHistoryRowConferenceProps = {
	_id: string;
	rid: string;
	title?: string;
	usersCount: number;
	type: 'outbound' | 'inbound';
	status: CallHistoryItemState;
	timestamp: string;
	/** Offered for a call that is still running, which is what makes this list the way back into one. */
	onJoin?: () => void;
};

const getStatusIcon = (status: CallHistoryItemState) => {
	switch (status) {
		case 'ongoing':
			return 'phone';
		case 'ended':
			return 'phone-off';
		case 'not-answered':
			return 'phone-question-mark';
		case 'failed':
		case 'error':
			return 'phone-issue';
		case 'transferred':
			return 'arrow-forward';
	}
};

const getStatusVariant = (status: CallHistoryItemState) => {
	switch (status) {
		case 'ongoing':
			return 'status-font-on-success';
		case 'not-answered':
			return 'status-font-on-warning';
		case 'failed':
		case 'error':
			return 'status-font-on-danger';
		default:
			return 'secondary';
	}
};

const getStatusText = (status: CallHistoryItemState, t: TFunction) => {
	switch (status) {
		case 'ongoing':
			return t('Ongoing');
		case 'ended':
			return t('Ended');
		case 'not-answered':
			return t('Not_answered');
		case 'failed':
		case 'error':
			return t('Failed');
		case 'transferred':
			return t('Transferred');
	}
};

// Conferences are room-and-participants shaped, not contact-shaped, so this doesn't reuse
// `CallHistoryTableRow` from `@rocket.chat/ui-voip` — its `contact`/`duration` props don't apply here.
// Clicking the row opens the conference's room directly, mirroring the "Call chat" action already used for
// conferences elsewhere, instead of the contact-shaped call info panel the other rows open.
const CallHistoryRowConference = ({ _id, rid, title, usersCount, type, status, timestamp, onJoin }: CallHistoryRowConferenceProps) => {
	const { t } = useTranslation();
	const locale = useLanguage();
	const goToRoom = useGoToRoom();

	const handleClick = useCallback(() => {
		if (rid) {
			void goToRoom(rid);
		}
	}, [goToRoom, rid]);

	return (
		<GenericTableRow key={_id} onClick={handleClick} tabIndex={0} role='link' action>
			<GenericTableCell>
				<Box display='flex' flexDirection='row' alignItems='center'>
					<Box marginInlineEnd={8}>
						<FramedIcon icon='video' size={28} />
					</Box>
					<Box display='flex' flexDirection='column' withTruncatedText>
						<Box withTruncatedText>{title || t('Video_call')}</Box>
						<Box color='hint' fontScale='c1'>
							{t('__usersCount__participants', { count: usersCount })}
						</Box>
					</Box>
				</Box>
			</GenericTableCell>
			<GenericTableCell>
				<Box display='flex' flexDirection='row' alignItems='center'>
					<Icon name={type === 'outbound' ? 'arrow-up-right' : 'arrow-down-left'} color='primary' size={20} marginInlineEnd={8} />
					{t('Video_call')}
				</Box>
			</GenericTableCell>
			<GenericTableCell>
				<Box display='flex' flexDirection='row' alignItems='center' color={getStatusVariant(status)}>
					<Icon name={getStatusIcon(status)} color={getStatusVariant(status)} size={20} marginInlineEnd={8} />
					{getStatusText(status, t)}
				</Box>
			</GenericTableCell>
			<GenericTableCell>{intlFormatDistance(new Date(timestamp), new Date(), { locale: locale ?? 'en-US' })}</GenericTableCell>
			<GenericTableCell>
				{/* The row itself opens the call's room, so joining has to stop there — one row, two destinations. */}
				{onJoin ? (
					<Button
						small
						primary
						onClick={(event) => {
							event.stopPropagation();
							onJoin();
						}}
					>
						{t('Join')}
					</Button>
				) : (
					<GenericMenu title={t('Options')} items={[]} />
				)}
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default CallHistoryRowConference;
