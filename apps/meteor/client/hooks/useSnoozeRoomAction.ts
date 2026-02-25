import { useMethod, useToastMessageDispatch, useUserId, useRouter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { roomsQueryKeys } from '../lib/queryKeys';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { updateSubscription } from '../lib/mutationEffects/updateSubscription';

type SnoozeRoomActionProps = {
    rid: string;
};

export const useSnoozeRoomAction = ({ rid }: SnoozeRoomActionProps): GenericMenuItemProps[] => {
    const { t } = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();
    const snoozeRoom = useMethod('snoozeRoom');
    const queryClient = useQueryClient();
    const userId = useUserId();
    const router = useRouter();

    return useMemo(() => {
        const handleSnooze = (durationMinutes: number) => async () => {
            try {
                await snoozeRoom(rid, durationMinutes);

                if (userId) {
                    updateSubscription(rid, userId, { alert: false, open: false });
                }

                router.navigate('/home');

                dispatchToastMessage({ type: 'success', message: t('Room_snoozed') });
                queryClient.removeQueries({ queryKey: roomsQueryKeys.all });
            } catch (error) {
                dispatchToastMessage({ type: 'error', message: error });
            }
        };

        return [
            {
                id: 'snooze-1h',
                icon: 'clock',
                content: t('1 hour'),
                onClick: handleSnooze(60),
            },
            {
                id: 'snooze-8h',
                icon: 'clock',
                content: t('8 hours'),
                onClick: handleSnooze(8 * 60),
            },
            {
                id: 'snooze-24h',
                icon: 'clock',
                content: t('24 hours'),
                onClick: handleSnooze(24 * 60),
            },
            {
                id: 'snooze-1w',
                icon: 'clock',
                content: t('1 week'),
                onClick: handleSnooze(7 * 24 * 60),
            },
        ];
    }, [t, rid, snoozeRoom, dispatchToastMessage, queryClient, userId, router]);
};
