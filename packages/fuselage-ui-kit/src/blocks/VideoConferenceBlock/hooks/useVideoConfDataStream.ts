import { useStream } from '@rocket.chat/ui-contexts';
import { Emitter } from '@rocket.chat/emitter';
import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useVideoConfData } from './useVideoConfData';

const ee = new Emitter();

const events = new Map();

const useStreamBySubPath = (
  streamer: ReturnType<typeof useStream>,
  subpath: string,
  callback: () => void
) => {
  useEffect(() => {
    if (!ee.has(subpath)) {
      events.set(
        subpath,
        streamer(subpath, (...args) => {
          ee.emit(subpath, ...args);
        })
      );
    }

    return () => {
      if (!ee.has(subpath)) {
        events.delete(subpath);
      }
    };
  }, [streamer, subpath, callback]);

  useEffect(() => {
    ee.on(subpath, callback);

    return () => {
      ee.off(subpath, callback);
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
