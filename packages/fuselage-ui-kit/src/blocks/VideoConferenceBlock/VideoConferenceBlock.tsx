import { getUserDisplayName, VideoConferenceStatus } from '@rocket.chat/core-typings';
import { useGoToRoom, useSetting, useTranslation, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import {
	VideoConfMessageSkeleton,
	VideoConfMessage,
	VideoConfMessageRow,
	VideoConfMessageIcon,
	VideoConfMessageText,
	VideoConfMessageFooter,
	VideoConfMessageUserStack,
	VideoConfMessageFooterText,
	VideoConfMessageButton,
	VideoConfMessageContent,
	VideoConfMessageActions,
	VideoConfMessageAction,
	useVideoConfJoinCall,
	useVideoConfSetPreferences,
} from '@rocket.chat/ui-video-conf';
import type { MouseEventHandler } from 'react';
import { useContext, memo, useMemo } from 'react';

import { UiKitContext } from '../..';
import { useVideoConfDataStream } from './hooks/useVideoConfDataStream';
import { useSurfaceType } from '../../hooks/useSurfaceType';
import type { BlockProps } from '../../utils/BlockProps';

export type VideoConferenceBlockProps = BlockProps<UiKit.VideoConferenceBlock>;

const MAX_USERS = 3;

// "5:32" / "1:02:07" — compact call duration for the ended card
const formatCallDuration = (startedAt: string, endedAt: string): string | undefined => {
	const totalSeconds = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
	if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
		return undefined;
	}
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const pad = (value: number) => String(value).padStart(2, '0');
	return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
};

const VideoConferenceBlock = ({ block }: VideoConferenceBlockProps) => {
	const t = useTranslation();
	const { callId, appId = 'videoconf-core' } = block;
	const surfaceType = useSurfaceType();
	const userId = useUserId();
	const goToRoom = useGoToRoom();
	const displayAvatars = useUserPreference<boolean>('displayAvatars');
	const showRealName = useSetting('UI_Use_Real_Name', false);

	const { action, viewId = undefined, rid } = useContext(UiKitContext);
	const joinCall = useVideoConfJoinCall();
	const setPreferences = useVideoConfSetPreferences();

	if (surfaceType !== 'message') {
		throw new Error('VideoConferenceBlock cannot be rendered outside message');
	}

	if (!rid) {
		throw new Error('VideoConferenceBlock cannot be rendered without rid');
	}

	const result = useVideoConfDataStream({ rid, callId });

	const callAgainHandler: MouseEventHandler<HTMLButtonElement> = (e): void => {
		void action(
			{
				blockId: rid || '',
				appId,
				actionId: 'callBack',
				value: rid || '',
				viewId,
			},
			e,
		);
	};

	const openCallInfo: MouseEventHandler<HTMLButtonElement> = (e) => {
		void action(
			{
				blockId: callId,
				appId,
				actionId: 'info',
				value: rid,
				viewId,
			},
			e,
		);
	};

	const openDiscussion: MouseEventHandler<HTMLButtonElement> = (_e) => {
		if (data.discussionRid) {
			void goToRoom(data.discussionRid);
		}
	};

	const messageFooterText = useMemo(() => {
		const usersCount = result.data?.users.length;

		if (!displayAvatars) {
			return t('__usersCount__joined', {
				count: usersCount,
			});
		}

		return usersCount && usersCount > MAX_USERS
			? t('plus__usersCount__joined', {
					count: usersCount - MAX_USERS,
				})
			: t('joined');
	}, [displayAvatars, t, result.data?.users.length]);

	if (result.isPending || result.isError) {
		// TODO: error handling
		return <VideoConfMessageSkeleton />;
	}

	const { data } = result;
	const isUserCaller = data.createdBy._id === userId;

	const joinedNamesOrUsernames = [...data.users]
		.splice(0, MAX_USERS)
		.map(({ name, username }) => getUserDisplayName(name, username, showRealName))
		.join(', ');

	const title =
		data.users.length > MAX_USERS
			? t('__usernames__and__count__more_joined', {
					usernames: joinedNamesOrUsernames,
					count: data.users.length - MAX_USERS,
				})
			: t('__usernames__joined', { usernames: joinedNamesOrUsernames });

	const joinHandler: MouseEventHandler<HTMLButtonElement> = (e): void => {
		e.preventDefault();
		setPreferences({ mic: true, cam: false });
		void joinCall(callId, data.providerName, data.rid);
	};

	const actions = (
		<VideoConfMessageActions>
			{data.discussionRid && <VideoConfMessageAction icon='discussion' title={t('Join_discussion')} onClick={openDiscussion} />}
			<VideoConfMessageAction icon='info' onClick={openCallInfo} />
		</VideoConfMessageActions>
	);

	if ('endedAt' in data) {
		// The card is the room's call history: Ended keeps duration + who
		// attended ("did I miss anything?"), missed/declined get their own
		// title instead of a generic "Call ended".
		const isMissed = data.status === VideoConferenceStatus.EXPIRED;
		const isDeclined = data.status === VideoConferenceStatus.DECLINED;
		const endedTitle = (isMissed && t('Missed_call')) || (isDeclined && t('Declined_call')) || t('Call_ended');
		const duration =
			!isMissed && !isDeclined && data.users.length && data.createdAt && data.endedAt
				? formatCallDuration(data.createdAt, data.endedAt)
				: undefined;

		return (
			<VideoConfMessage>
				<VideoConfMessageRow>
					<VideoConfMessageContent>
						<VideoConfMessageIcon />
						<VideoConfMessageText>{endedTitle}</VideoConfMessageText>
						{duration && <VideoConfMessageFooterText>{duration}</VideoConfMessageFooterText>}
					</VideoConfMessageContent>
					{actions}
				</VideoConfMessageRow>
				<VideoConfMessageFooter>
					{data.type === 'direct' && (
						<>
							<VideoConfMessageButton onClick={callAgainHandler}>{isUserCaller ? t('Call_again') : t('Call_back')}</VideoConfMessageButton>
							{(isMissed || isDeclined) && <VideoConfMessageFooterText>{t('Call_was_not_answered')}</VideoConfMessageFooterText>}
						</>
					)}
					{data.type !== 'direct' &&
						(data.users.length ? (
							<>
								<VideoConfMessageUserStack users={data.users} />
								<VideoConfMessageFooterText title={title}>{messageFooterText}</VideoConfMessageFooterText>
							</>
						) : (
							(isMissed || isDeclined) && <VideoConfMessageFooterText>{t('Call_was_not_answered')}</VideoConfMessageFooterText>
						))}
				</VideoConfMessageFooter>
			</VideoConfMessage>
		);
	}

	if (data.type === 'direct' && data.status === VideoConferenceStatus.CALLING) {
		return (
			<VideoConfMessage>
				<VideoConfMessageRow>
					<VideoConfMessageContent>
						<VideoConfMessageIcon variant='incoming' />
						<VideoConfMessageText>{t('Calling')}</VideoConfMessageText>
					</VideoConfMessageContent>
					{actions}
				</VideoConfMessageRow>
				<VideoConfMessageFooter>
					<VideoConfMessageFooterText>{t('Waiting_for_answer')}</VideoConfMessageFooterText>
				</VideoConfMessageFooter>
			</VideoConfMessage>
		);
	}

	return (
		<VideoConfMessage>
			<VideoConfMessageRow>
				<VideoConfMessageContent>
					<VideoConfMessageIcon variant='outgoing' />
					<VideoConfMessageText>{t('Call_ongoing')}</VideoConfMessageText>
				</VideoConfMessageContent>
				{actions}
			</VideoConfMessageRow>
			<VideoConfMessageFooter>
				<VideoConfMessageButton primary onClick={joinHandler}>
					{t('Join')}
				</VideoConfMessageButton>
				{Boolean(data.users.length) && (
					<>
						<VideoConfMessageUserStack users={data.users} />
						<VideoConfMessageFooterText title={title}>{messageFooterText}</VideoConfMessageFooterText>
					</>
				)}
			</VideoConfMessageFooter>
		</VideoConfMessage>
	);
};

export default memo(VideoConferenceBlock);
