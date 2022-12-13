import type * as UiKit from '@rocket.chat/ui-kit';
import { useTranslation } from '@rocket.chat/ui-contexts';
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
import React, { useContext, memo } from 'react';

import { useSurfaceType } from '../../contexts/SurfaceContext';
import type { BlockProps } from '../../utils/BlockProps';
import { useVideoConfDataStream } from './hooks/useVideoConfDataStream';
import { kitContext } from '../..';

type VideoConferenceBlockProps = BlockProps<UiKit.VideoConferenceBlock>;

const MAX_USERS = 6;

const VideoConferenceBlock = ({
  block,
}: VideoConferenceBlockProps): ReactElement => {
  const t = useTranslation();
  const { callId, appId = 'videoconf-core' } = block;
  const surfaceType = useSurfaceType();

  const { action, viewId, rid } = useContext(kitContext);

  if (surfaceType !== 'message') {
    return <></>;
  }

  if (!callId || !rid) {
    return <></>;
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

  if (result.isSuccess) {
    const { data } = result;

    if ('endedAt' in data) {
      return (
        <VideoConfMessage>
          <VideoConfMessageRow>
            <VideoConfMessageContent>
              <VideoConfMessageIcon />
              <VideoConfMessageText>{t('Call_ended')}</VideoConfMessageText>
            </VideoConfMessageContent>
            <VideoConfMessageActions>
              <VideoConfMessageAction icon='info' onClick={openCallInfo} />
            </VideoConfMessageActions>
          </VideoConfMessageRow>
          <VideoConfMessageFooter>
            {data.type === 'direct' && (
              <>
                <VideoConfMessageButton onClick={callAgainHandler}>
                  {t('Call_back')}
                </VideoConfMessageButton>
                <VideoConfMessageFooterText>
                  {t('Call_was_not_answered')}
                </VideoConfMessageFooterText>
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
                <VideoConfMessageFooterText>
                  {t('Call_was_not_answered')}
                </VideoConfMessageFooterText>
              ))}
          </VideoConfMessageFooter>
        </VideoConfMessage>
      );
    }

    if (data.type === 'direct' && data.status === 0) {
      return (
        <VideoConfMessage>
          <VideoConfMessageRow>
            <VideoConfMessageContent>
              <VideoConfMessageIcon variant='incoming' />
              <VideoConfMessageText>{t('Calling')}</VideoConfMessageText>
            </VideoConfMessageContent>
            <VideoConfMessageActions>
              <VideoConfMessageAction icon='info' onClick={openCallInfo} />
            </VideoConfMessageActions>
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
          <VideoConfMessageActions>
            <VideoConfMessageAction icon='info' onClick={openCallInfo} />
          </VideoConfMessageActions>
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
                      usersCount: data.users.length - MAX_USERS,
                    })
                  : t('joined')}
              </VideoConfMessageFooterText>
            </>
          )}
        </VideoConfMessageFooter>
      </VideoConfMessage>
    );
  }

  return <VideoConfMessageSkeleton />;
};

export default memo(VideoConferenceBlock);
