import { useSingleStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useVideoConfData } from './useVideoConfData';

export const useVideoConfDataStream = ({
  rid,
  callId,
}: {
  rid: string;
  callId: string;
}) => {
  const queryClient = useQueryClient();

  const subscribeNotifyRoom = useSingleStream('notify-room');

  useEffect(() => {
    return subscribeNotifyRoom(
      `${rid}/videoconf`,
      (id) =>
        id === callId &&
        queryClient.invalidateQueries(['video-conference', callId])
    );
  }, [rid, callId]);

  return useVideoConfData({ callId });
};
