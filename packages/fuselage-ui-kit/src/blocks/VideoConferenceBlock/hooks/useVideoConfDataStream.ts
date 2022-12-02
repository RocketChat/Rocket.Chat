import { useStream } from '@rocket.chat/ui-contexts';
import { Emitter } from '@rocket.chat/emitter';
import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useVideoConfData } from './useVideoConfData';

const ee = new Emitter<Record<string, void>>();

const events = new Map<string, () => void>();

const useStreamBySubPath = (
  streamer: ReturnType<typeof useStream>,
  subpath: string,
  callback: () => void
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
    ee.on(subpath, callback);

    return () => {
      ee.off(subpath, callback);
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
  const subpath = `${rid}/${callId}`;

  const subscribeNotifyRoom = useStream('notify-room');

  useStreamBySubPath(
    subscribeNotifyRoom,
    subpath,
    useCallback(() => {
      queryClient.invalidateQueries(['video-conference', callId]);
    }, [subpath])
  );
  return useVideoConfData({ callId });
};
