import { useStream } from '@rocket.chat/ui-contexts';
import { Emitter } from '@rocket.chat/emitter';
import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useVideoConfData } from './useVideoConfData';

const ee = new Emitter();

const events = new Map<string, () => void>();

const useStreamBySubPath = <T extends ReturnType<typeof useStream>>(
  streamer: T,
  subpath: Parameters<T>[0],
  callback: Parameters<T>[1]
) => {
  const maybeSubscribe = useCallback(() => {
    // If we're already subscribed, don't do it again
    if (events.has(subpath)) {
      return;
    }

    events.set(
      subpath,
      streamer(subpath, () => {
        ee.emit(subpath);
      })
    );
  }, [streamer, subpath]);

  const maybeUnsubscribe = useCallback(() => {
    // If someone is still listening, don't unsubscribe
    if (ee.has(subpath)) {
      return;
    }

    const unsubscribe = events.get(subpath);
    if (unsubscribe) {
      unsubscribe();
      events.delete(subpath);
    }
  }, [subpath]);

  useEffect(() => {
    maybeSubscribe();
    ee.on(subpath, callback as any);

    return () => {
      ee.off(subpath, callback as any);
      maybeUnsubscribe();
    };
  }, [callback, subpath]);
};

export const useVideoConfDataStream = ({
  rid,
  callId,
}: {
  rid: string;
  callId: string;
}) => {
  const queryClient = useQueryClient();

  const subscribeNotifyRoom = useStream('notify-room');

  useStreamBySubPath(
    subscribeNotifyRoom,
    `${rid}/videoconf`,
    useCallback(
      (id) => {
        if (id !== callId) {
          return;
        }
        queryClient.invalidateQueries(['video-conference', callId]);
      },
      [callId, queryClient]
    )
  );
  return useVideoConfData({ callId });
};
