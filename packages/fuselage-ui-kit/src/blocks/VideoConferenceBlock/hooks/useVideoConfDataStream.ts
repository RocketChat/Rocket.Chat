import type { IRoom } from '@rocket.chat/core-typings';
import { useStream } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useVideoConfData } from './useVideoConfData';

export const useVideoConfDataStream = ({
  rid,
  callId,
}: {
  rid: IRoom['_id'];
  callId: string;
}) => {
  const queryClient = useQueryClient();

  const subscribeNotifyRoom = useStream('notify-room');

  useEffect(() => {
    return subscribeNotifyRoom(
      `${rid}/videoconf`,
      (id) =>
        id === callId &&
        queryClient.invalidateQueries({
          queryKey: ['video-conference', callId],
        }),
    );
  }, [rid, callId, subscribeNotifyRoom, queryClient]);

  return useVideoConfData({ callId });
};
