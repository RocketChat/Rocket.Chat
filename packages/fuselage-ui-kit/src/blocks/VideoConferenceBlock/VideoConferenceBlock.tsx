import type * as UiKit from '@rocket.chat/ui-kit';
import { useTranslation, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { Avatar } from '@rocket.chat/fuselage';
import {
  VideoConfMessageSkeleton,
  VideoConfMessage,
  VideoConfMessageRow,
  VideoConfMessageIcon,
  VideoConfMessageText,
  VideoConfMessageFooter,
  VideoConfMessageAction,
  VideoConfMessageUserStack,
  VideoConfMessageFooterText,
} from '@rocket.chat/ui-video-conf';
import type { MouseEventHandler, ReactElement } from 'react';
import React, { useContext, memo } from 'react';

import { useSurfaceType } from '../../contexts/SurfaceContext';
import type { BlockProps } from '../../utils/BlockProps';
import { useVideoConfDataStream } from './hooks/useVideoConfDataStream';
import { kitContext } from '../..';

type VideoConferenceBlockProps = BlockProps<UiKit.VideoConferenceBlock>;

const VideoConferenceBlock = ({
  block,
}: VideoConferenceBlockProps): ReactElement => {
  const { callId, appId = 'videoconf-core' } = block;
  const surfaceType = useSurfaceType();

  const { action, viewId, rid } = useContext(kitContext);

  if (surfaceType !== 'message') {
    return <></>;
  }

  if (!callId || !rid) {
    return <></>;
  }

  const getUserAvatarPath = useUserAvatarPath();

  const result = useVideoConfDataStream({ rid, callId });

  const t = useTranslation();

  const joinHandler: MouseEventHandler<HTMLButtonElement> = (e): void => {
    action(
      {
        blockId: block.blockId || '',
        appId,
        actionId: 'join',
        value: '???',
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
            <VideoConfMessageIcon />
            <VideoConfMessageText>{t('Call ended')}</VideoConfMessageText>
          </VideoConfMessageRow>
          <VideoConfMessageFooter>
            <VideoConfMessageAction>{t('Call Back')}</VideoConfMessageAction>
            <VideoConfMessageFooterText>
              {t('Call was not answered')}
            </VideoConfMessageFooterText>
          </VideoConfMessageFooter>
        </VideoConfMessage>
      );
    }

    if (data.status === 1) {
      return (
        <VideoConfMessage>
          <VideoConfMessageRow>
            <VideoConfMessageIcon variant='outgoing' />
            <VideoConfMessageText>{t('Call ongoing')}</VideoConfMessageText>
          </VideoConfMessageRow>
          <VideoConfMessageFooter>
            <VideoConfMessageAction primary onClick={joinHandler}>
              {t('Join')}
            </VideoConfMessageAction>
            <VideoConfMessageUserStack>
              {data.users.map(({ username }, index) => (
                <Avatar
                  size='x28'
                  key={index}
                  url={getUserAvatarPath(username as string)}
                />
              ))}
            </VideoConfMessageUserStack>
            <VideoConfMessageFooterText>
              {t('Joined')}
            </VideoConfMessageFooterText>
          </VideoConfMessageFooter>
        </VideoConfMessage>
      );
    }
  }
  return <VideoConfMessageSkeleton />;
};

export default memo(VideoConferenceBlock);
