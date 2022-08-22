import type * as UiKit from '@rocket.chat/ui-kit';
import { VideoConfMessageSkeleton } from '@rocket.chat/ui-video-conf';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useSurfaceType } from '../../contexts/SurfaceContext';
import type { BlockProps } from '../../utils/BlockProps';
import { useVideoConfData } from './hooks/useVideoConfData';

type VideoConferenceBlockProps = BlockProps<UiKit.VideoConferenceBlock>;

const VideoConferenceBlock = ({
  block: { callId },
}: VideoConferenceBlockProps): ReactElement => {
  const surfaceType = useSurfaceType();

  if (surfaceType !== 'message') {
    return <></>;
  }

  if (!callId) {
    return <></>;
  }

  const result = useVideoConfData({ callId });

  if (result.isLoading) {
    return <VideoConfMessageSkeleton />;
  }
  return <>done</>;
};

export default memo(VideoConferenceBlock);
