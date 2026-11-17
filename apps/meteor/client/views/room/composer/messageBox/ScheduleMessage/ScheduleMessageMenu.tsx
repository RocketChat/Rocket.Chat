import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { SplitButton, SplitButtonTrigger } from '@rocket.chat/fuselage';
import { Random } from '@rocket.chat/random';
import { GenericMenu, useFormatDateAndTime, useFormatTime } from '@rocket.chat/ui-client';
import { useRoomToolbox, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import ScheduleMessageModal from '../../../../../components/ScheduledMessages/ScheduleMessageModal';
import { getSchedulePresets } from '../../../../../components/ScheduledMessages/schedulePresets';
import { toScheduledFiles } from '../../../../../components/ScheduledMessages/toScheduledFiles';
import { useCanScheduleMessages } from '../../../../../hooks/useCanScheduleMessages';
import { useExperimentalEndpoint } from '../../../../../hooks/useExperimentalEndpoint';
import { useMyScheduledMessages } from '../../../../../hooks/useScheduledMessages';
import type { ComposerAPI } from '../../../../../lib/chats/ChatAPI';
import { onClientBeforeSendMessage } from '../../../../../lib/onClientBeforeSendMessage';
import { scheduledMessagesQueryKeys } from '../../../../../lib/queryKeys';
import { useRoom } from '../../../contexts/RoomContext';
import { useE2EERoomState } from '../../../hooks/useE2EERoomState';

const none: readonly never[] = [];
const emptyStore = { get: (): readonly never[] => none, subscribe: () => () => undefined };

type ScheduleMessageMenuProps = {
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
	tshow?: IMessage['tshow'];
	composer?: ComposerAPI;
	disabled: boolean;
	primary?: boolean;
	children?: ReactNode;
};

const ScheduleMessageMenu = ({ rid, tmid, tshow, composer, disabled, primary, children }: ScheduleMessageMenuProps) => {
	const { t } = useTranslation();
	const canSchedule = useCanScheduleMessages(rid);
	const room = useRoom();
	const { openTab } = useRoomToolbox();
	const { data: count = 0 } = useMyScheduledMessages({
		select: (items) => items.filter((item) => item.rid === rid).length,
		enabled: canSchedule,
	});
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const formatDateAndTime = useFormatDateAndTime();
	const formatTime = useFormatTime();
	const queryClient = useQueryClient();
	const createScheduledMessage = useExperimentalEndpoint('POST', '/experimental/scheduledMessages.create');

	const quotesStore = composer?.quotedMessages ?? emptyStore;
	const quotes = useSyncExternalStore<readonly unknown[]>(quotesStore.subscribe, quotesStore.get);
	const uploadsStore = composer?.uploads ?? emptyStore;
	const uploads = useSyncExternalStore<readonly unknown[]>(uploadsStore.subscribe, uploadsStore.get);
	const e2eState = useE2EERoomState(rid);

	const { mutate, mutateAsync, isPending } = useMutation({
		mutationFn: async ({ msg, scheduledAt }: { msg: string; scheduledAt: Date }) => {
			if (msg.startsWith('/') || msg.startsWith('+:')) {
				throw new Error(t('Schedule_message_not_supported'));
			}
			const files = toScheduledFiles(composer?.uploads.get() ?? none);
			const message = await onClientBeforeSendMessage({ _id: Random.id(), rid, msg, ...(tmid && { tmid }) });
			const body =
				message.t === 'e2e' ? { msg: '', t: 'e2e' as const, content: message.content, e2eMentions: message.e2eMentions } : { msg };
			return createScheduledMessage({
				rid,
				...body,
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

	if (!canSchedule || isOmnichannelRoom(room)) {
		return children;
	}

	const schedule = (scheduledAt: Date) => mutate({ msg: composer?.text.trim() ?? '', scheduledAt });
	const encryptionBlocks = !!room.encrypted && (e2eState !== 'READY' || uploads.length > 0);
	const cannotSchedule = disabled || isPending || quotes.length > 0 || encryptionBlocks;

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
		<SplitButton primary={primary} aria-label={t('Send')}>
			{children}
			<GenericMenu
				icon='chevron-up'
				detached
				disabled={disabled}
				title={t('Schedule_message')}
				button={<SplitButtonTrigger size='small' icon='chevron-up' />}
				sections={[
					{
						title: t('Schedule_message'),
						items: [
							{
								id: 'tomorrow',
								content: t('Schedule_tomorrow', { time: formatTime(presetTime) }),
								onClick: () => schedule(getSchedulePresets(new Date()).tomorrow),
								disabled: cannotSchedule,
								gap: false,
							},
							{
								id: 'monday',
								content: t('Schedule_monday', { time: formatTime(presetTime) }),
								onClick: () => schedule(getSchedulePresets(new Date()).nextMonday),
								disabled: cannotSchedule,
								gap: false,
							},
							{ id: 'custom', content: t('Schedule_custom'), onClick: openCustomTime, disabled: cannotSchedule, gap: false },
						],
					},
					{
						items: [
							{
								id: 'scheduled-messages',
								icon: 'clock-send',
								content: count ? `${t('Scheduled_messages')} (${count})` : t('Scheduled_messages'),
								onClick: () => openTab('scheduled-messages'),
							},
						],
					},
				]}
			/>
		</SplitButton>
	);
};

export default ScheduleMessageMenu;
