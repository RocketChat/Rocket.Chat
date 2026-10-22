import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { SplitButtonTrigger } from '@rocket.chat/fuselage';
import { GenericMenu, useFormatDateAndTime, useFormatTime } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

import ScheduleMessageModal from '../../../../../components/ScheduledMessages/ScheduleMessageModal';
import { getSchedulePresets } from '../../../../../components/ScheduledMessages/schedulePresets';
import { toScheduledFiles } from '../../../../../components/ScheduledMessages/toScheduledFiles';
import { useCanScheduleMessages } from '../../../../../hooks/useCanScheduleMessages';
import type { ComposerAPI } from '../../../../../lib/chats/ChatAPI';
import { scheduledMessagesQueryKeys } from '../../../../../lib/queryKeys';
import { useRoom } from '../../../contexts/RoomContext';

const none: readonly never[] = [];
const emptyStore = { get: (): readonly never[] => none, subscribe: () => () => undefined };

type ScheduleMessageMenuProps = {
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
	tshow?: IMessage['tshow'];
	composer?: ComposerAPI;
	disabled: boolean;
};

const ScheduleMessageMenu = ({ rid, tmid, tshow, composer, disabled }: ScheduleMessageMenuProps) => {
	const { t } = useTranslation();
	const canSchedule = useCanScheduleMessages(rid);
	const room = useRoom();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const formatDateAndTime = useFormatDateAndTime();
	const formatTime = useFormatTime();
	const queryClient = useQueryClient();
	const createScheduledMessage = useEndpoint('POST', '/v1/scheduledMessages.create');

	const quotesStore = composer?.quotedMessages ?? emptyStore;
	const quotes = useSyncExternalStore<readonly unknown[]>(quotesStore.subscribe, quotesStore.get);

	const { mutate, mutateAsync, isPending } = useMutation({
		mutationFn: async ({ msg, scheduledAt }: { msg: string; scheduledAt: Date }) => {
			if (msg.startsWith('/') || msg.startsWith('+:')) {
				throw new Error(t('Schedule_message_not_supported'));
			}
			const files = toScheduledFiles(composer?.uploads.get() ?? none);
			return createScheduledMessage({
				rid,
				msg,
				...(tmid && { tmid, ...(tshow && { tshow }) }),
				...(files.length > 0 && { files }),
				scheduledAt: scheduledAt.toISOString(),
			});
		},
		onSuccess: ({ scheduledMessage }, { msg }) => {
			if (composer?.text.trim() === msg) {
				composer.clear();
			}
			composer?.uploads.clear();
			dispatchToastMessage({
				type: 'success',
				message: t('Message_scheduled_for', { date: formatDateAndTime(new Date(scheduledMessage.scheduledAt)) }),
			});
			void queryClient.invalidateQueries({ queryKey: scheduledMessagesQueryKeys.all });
		},
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	if (!canSchedule || room.encrypted || isOmnichannelRoom(room)) {
		return null;
	}

	const schedule = (scheduledAt: Date) => mutate({ msg: composer?.text.trim() ?? '', scheduledAt });

	const { tomorrow: presetTime } = getSchedulePresets(new Date());
	const openCustomTime = () =>
		setModal(
			<ScheduleMessageModal
				onConfirm={async (scheduledAt) => {
					await mutateAsync({ msg: composer?.text.trim() ?? '', scheduledAt });
					setModal(null);
				}}
				onClose={() => setModal(null)}
			/>,
		);

	return (
		<GenericMenu
			icon='chevron-up'
			detached
			disabled={disabled || isPending || quotes.length > 0}
			title={t('Schedule_message')}
			button={<SplitButtonTrigger small icon='chevron-up' />}
			sections={[
				{
					title: t('Schedule_message'),
					items: [
						{
							id: 'tomorrow',
							content: t('Schedule_tomorrow', { time: formatTime(presetTime) }),
							onClick: () => schedule(getSchedulePresets(new Date()).tomorrow),
						},
						{
							id: 'next-monday',
							content: t('Schedule_next_monday', { time: formatTime(presetTime) }),
							onClick: () => schedule(getSchedulePresets(new Date()).nextMonday),
						},
						{ id: 'custom', content: t('Schedule_custom'), onClick: openCustomTime },
					],
				},
			]}
		/>
	);
};

export default ScheduleMessageMenu;
