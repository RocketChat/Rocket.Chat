import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useVideoConfData = ({ callId }: { callId: string }) => {
  const getVideoConfInfo = useEndpoint('GET', '/v1/video-conference.info');

  return useQuery(
    ['video-conference', callId],
    () => getVideoConfInfo({ callId }),
    {
      staleTime: Infinity,
      refetchOnMount: (query) => {
        if (query.state.data?.endedAt) {
          return false;
        }

        return 'always';
      },
    }
  );
};
