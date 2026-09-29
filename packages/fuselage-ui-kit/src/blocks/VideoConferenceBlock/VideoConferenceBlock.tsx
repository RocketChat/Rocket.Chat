import { getUserDisplayName, hasJoinedVideoConference, VideoConferenceStatus } from '@rocket.chat/core-typings';
import { useSetting, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
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
	VideoConfContext,
} from '@rocket.chat/ui-video-conf';
import type { MouseEventHandler } from 'react';
import { useContext, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { UiKitContext } from '../..';
import { useGoToRoom } from './hooks/useGoToRoom';
import { useVideoConfDataStream } from './hooks/useVideoConfDataStream';
import { useSurfaceType } from '../../hooks/useSurfaceType';
import type { BlockProps } from '../../utils/BlockProps';

export type VideoConferenceBlockProps = BlockProps<UiKit.VideoConferenceBlock>;

const MAX_USERS = 3;

const VideoConferenceBlock = ({ block }: VideoConferenceBlockProps) => {
	const { t } = useTranslation();
	const { callId, appId = 'videoconf-core' } = block;
	const surfaceType = useSurfaceType();
	const userId = useUserId();
	const goToRoom = useGoToRoom();
	const displayAvatars = useUserPreference<boolean>('displayAvatars');
	const showRealName = useSetting('UI_Use_Real_Name', false);

	const { action, viewId = undefined, rid } = useContext(UiKitContext);

	// The call window renders this same message list beside the call it is already in, where "Join" and "Call
	// back" would start a second one.
	//
	// Read from the video-conf context rather than worked out here: which window this is, is the application's to
	// know, and a block that decided it for itself would have to know what a call window's address looks like.
	// Not `UiKitContext` either — that one is shared by every app's blocks and knows nothing about any of them.
	//
	// Read optionally, unlike the two throws above. Those guard what this component cannot render without; this
	// only decides whether a button is dimmed, and a surface that never mounts the provider should lose the
	// dimming rather than the message.
	const joinDisabled = useContext(VideoConfContext)?.joinDisabled ?? false;

	if (surfaceType !== 'message') {
		throw new Error('VideoConferenceBlock cannot be rendered outside message');
	}

	if (!rid) {
		throw new Error('VideoConferenceBlock cannot be rendered without rid');
	}

	const result = useVideoConfDataStream({ rid, callId });

	const joinHandler: MouseEventHandler<HTMLButtonElement> = (e): void => {
		void action(
			{
				blockId: block.blockId || '',
				appId,
				actionId: 'join',
				value: block.blockId || '',
				viewId,
			},
			e,
		);
	};

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

	// `users` is the conference's membership list, not who's currently in the call — a member can be added
	// without ever joining, so this must be filtered down to those who actually joined before it's counted
	// or displayed anywhere below. Without a username there is no avatar to draw either, so such a member would
	// consume a place in the stack and still be counted in the footer.
	const joinedUsers = useMemo(
		() => result.data?.users.filter((user) => !!user.username && hasJoinedVideoConference(user)) ?? [],
		[result.data?.users],
	);

	const messageFooterText = useMemo(() => {
		const usersCount = joinedUsers.length;

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
	}, [displayAvatars, t, joinedUsers.length]);

	if (result.isPending) {
		return <VideoConfMessageSkeleton />;
	}

	if (result.isError) {
		return (
			<VideoConfMessage>
				<VideoConfMessageRow>
					<VideoConfMessageContent>
						<VideoConfMessageIcon />
						<VideoConfMessageText>{t('Call_not_found')}</VideoConfMessageText>
					</VideoConfMessageContent>
				</VideoConfMessageRow>
				<VideoConfMessageFooter>
					<VideoConfMessageFooterText>{t('Call_not_found_error')}</VideoConfMessageFooterText>
				</VideoConfMessageFooter>
			</VideoConfMessage>
		);
	}

	const { data } = result;
	const isUserCaller = data.createdBy._id === userId;

	const joinedNamesOrUsernames = [...joinedUsers]
		.splice(0, MAX_USERS)
		.map(({ name, username }) => getUserDisplayName(name, username, showRealName))
		.join(', ');

	const title =
		joinedUsers.length > MAX_USERS
			? t('__usernames__and__count__more_joined', {
					usernames: joinedNamesOrUsernames,
					count: joinedUsers.length - MAX_USERS,
				})
			: t('__usernames__joined', { usernames: joinedNamesOrUsernames });

	const actions = (
		<VideoConfMessageActions>
			{data.discussionRid && <VideoConfMessageAction icon='discussion' title={t('Join_discussion')} onClick={openDiscussion} />}
			<VideoConfMessageAction icon='info' onClick={openCallInfo} />
		</VideoConfMessageActions>
	);

	if ('endedAt' in data) {
		return (
			<VideoConfMessage>
				<VideoConfMessageRow>
					<VideoConfMessageContent>
						<VideoConfMessageIcon />
						<VideoConfMessageText>{t('Call_ended')}</VideoConfMessageText>
					</VideoConfMessageContent>
					{actions}
				</VideoConfMessageRow>
				<VideoConfMessageFooter>
					{data.type === 'direct' && (
						<>
							<VideoConfMessageButton disabled={joinDisabled} onClick={callAgainHandler}>
								{isUserCaller ? t('Call_again') : t('Call_back')}
							</VideoConfMessageButton>
							{[VideoConferenceStatus.EXPIRED, VideoConferenceStatus.DECLINED].includes(data.status) && (
								<VideoConfMessageFooterText>{t('Call_was_not_answered')}</VideoConfMessageFooterText>
							)}
						</>
					)}
					{data.type !== 'direct' &&
						(joinedUsers.length ? (
							<>
								<VideoConfMessageUserStack users={joinedUsers} />
								<VideoConfMessageFooterText title={title}>{messageFooterText}</VideoConfMessageFooterText>
							</>
						) : (
							[VideoConferenceStatus.EXPIRED, VideoConferenceStatus.DECLINED].includes(data.status) && (
								<VideoConfMessageFooterText>{t('Call_was_not_answered')}</VideoConfMessageFooterText>
							)
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
				<VideoConfMessageButton primary disabled={joinDisabled} onClick={joinHandler}>
					{t('Join')}
				</VideoConfMessageButton>
				{Boolean(joinedUsers.length) && (
					<>
						<VideoConfMessageUserStack users={joinedUsers} />
						<VideoConfMessageFooterText title={title}>{messageFooterText}</VideoConfMessageFooterText>
					</>
				)}
			</VideoConfMessageFooter>
		</VideoConfMessage>
	);
};

export default memo(VideoConferenceBlock);
