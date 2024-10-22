import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import {
  useGoToRoom,
  useTranslation,
  useUserId,
} from '@rocket.chat/ui-contexts';
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
} from '@rocket.chat/ui-video-conf';
import type { MouseEventHandler, ReactElement } from 'react';
import { useContext, memo } from 'react';

import { UiKitContext } from '../..';
import { useSurfaceType } from '../../hooks/useSurfaceType';
import type { BlockProps } from '../../utils/BlockProps';
import { useVideoConfDataStream } from './hooks/useVideoConfDataStream';

type VideoConferenceBlockProps = BlockProps<UiKit.VideoConferenceBlock>;

const MAX_USERS = 3;

const VideoConferenceBlock = ({
  block,
}: VideoConferenceBlockProps): ReactElement => {
  const t = useTranslation();
  const { callId, appId = 'videoconf-core' } = block;
  const surfaceType = useSurfaceType();
  const userId = useUserId();
  const goToRoom = useGoToRoom();

  const { action, viewId = undefined, rid } = useContext(UiKitContext);

  if (surfaceType !== 'message') {
    throw new Error('VideoConferenceBlock cannot be rendered outside message');
  }

  if (!rid) {
    throw new Error('VideoConferenceBlock cannot be rendered without rid');
  }

  const result = useVideoConfDataStream({ rid, callId });

  const joinHandler: MouseEventHandler<HTMLButtonElement> = (e): void => {
    action(
      {
        blockId: block.blockId || '',
        appId,
        actionId: 'join',
        value: block.blockId || '',
        viewId,
      },
      e
    );
  };

  const callAgainHandler: MouseEventHandler<HTMLButtonElement> = (e): void => {
    action(
      {
        blockId: rid || '',
        appId,
        actionId: 'callBack',
        value: rid || '',
        viewId,
      },
      e
    );
  };

  const openCallInfo: MouseEventHandler<HTMLButtonElement> = (e) => {
    action(
      {
        blockId: callId,
        appId,
        actionId: 'info',
        value: rid,
        viewId,
      },
      e
    );
  };

  const openDiscussion: MouseEventHandler<HTMLButtonElement> = (_e) => {
    if (data.discussionRid) {
      goToRoom(data.discussionRid);
    }
  };

  if (result.isLoading || result.isError) {
    // TODO: error handling
    return <VideoConfMessageSkeleton />;
  }

  const { data } = result;
  const isUserCaller = data.createdBy._id === userId;

  const actions = (
    <VideoConfMessageActions>
      {data.discussionRid && (
        <VideoConfMessageAction
          icon='discussion'
          title={t('Join_discussion')}
          onClick={openDiscussion}
        />
      )}
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
              <VideoConfMessageButton onClick={callAgainHandler}>
                {isUserCaller ? t('Call_again') : t('Call_back')}
              </VideoConfMessageButton>
              {[
                VideoConferenceStatus.EXPIRED,
                VideoConferenceStatus.DECLINED,
              ].includes(data.status) && (
                <VideoConfMessageFooterText>
                  {t('Call_was_not_answered')}
                </VideoConfMessageFooterText>
              )}
            </>
          )}
          {data.type !== 'direct' &&
            (data.users.length ? (
              <>
                <VideoConfMessageUserStack users={data.users} />
                <VideoConfMessageFooterText>
                  {data.users.length > MAX_USERS
                    ? t('__usersCount__member_joined', {
                        usersCount: data.users.length - MAX_USERS,
                      })
                    : t('joined')}
                </VideoConfMessageFooterText>
              </>
            ) : (
              [
                VideoConferenceStatus.EXPIRED,
                VideoConferenceStatus.DECLINED,
              ].includes(data.status) && (
                <VideoConfMessageFooterText>
                  {t('Call_was_not_answered')}
                </VideoConfMessageFooterText>
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
          <VideoConfMessageFooterText>
            {t('Waiting_for_answer')}
          </VideoConfMessageFooterText>
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
            <VideoConfMessageFooterText>
              {data.users.length > MAX_USERS
                ? t('__usersCount__member_joined', {
                    count: data.users.length - MAX_USERS,
                  })
                : t('joined')}
            </VideoConfMessageFooterText>
          </>
        )}
      </VideoConfMessageFooter>
    </VideoConfMessage>
  );
};

export default memo(VideoConferenceBlock);
