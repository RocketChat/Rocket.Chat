import type { IMessage, IRoom, IScheduledMessage } from '@rocket.chat/core-typings';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useMediaUrl, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

import { toScheduledFiles } from '../../../../../components/ScheduledMessages/toScheduledFiles';
import type { ComposerAPI } from '../../../../../lib/chats/ChatAPI';
import { scheduledMessagesQueryKeys } from '../../../../../lib/queryKeys';

export type ScheduledMessageEdit = Pick<IScheduledMessage, 'msg' | 'files'> & { scheduledMessageId: IScheduledMessage['_id'] };
export type ScheduledMessageEditTarget = { rid: IRoom['_id']; tmid?: IMessage['_id'] };

const edits = new Map<string, ScheduledMessageEdit>();
const listeners = new Set<() => void>();

const keyOf = ({ rid, tmid }: ScheduledMessageEditTarget) => `${rid}/${tmid ?? ''}`;
const emit = () => listeners.forEach((listener) => listener());

export const scheduledMessageEditing = {
	start(target: ScheduledMessageEditTarget, edit: ScheduledMessageEdit) {
		edits.set(keyOf(target), edit);
		emit();
	},
	stop(target: ScheduledMessageEditTarget) {
		if (edits.delete(keyOf(target))) {
			emit();
		}
	},
	get: (target: ScheduledMessageEditTarget) => edits.get(keyOf(target)),
	subscribe(listener: () => void) {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	},
};

export const useScheduledMessageEditing = (
	rid: IRoom['_id'],
	tmid: IMessage['_id'] | undefined,
	composer: ComposerAPI | undefined,
	sendAsNew: (text: string) => void,
) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const updateScheduledMessage = useEndpoint('POST', '/v1/scheduledMessages.update');

	const editing = useSyncExternalStore(
		scheduledMessageEditing.subscribe,
		useCallback(() => scheduledMessageEditing.get({ rid, tmid }), [rid, tmid]),
	);

	const getMediaUrl = useMediaUrl();

	useEffect(() => {
		if (!editing || !composer) {
			return;
		}
		composer.setText(editing.msg);
		composer.setCursorToEnd?.();
		composer.uploads.clear();

		let cancelled = false;
		void Promise.all(
			(editing.files ?? []).map(async ({ _id, name, type, description }) => {
				const url = getMediaUrl(`/file-upload/${_id}/${encodeURIComponent(name)}`);
				const content = await fetch(url)
					.then((response) => (response.ok ? response.blob() : undefined))
					.catch(() => undefined);
				return { id: _id, url, percentage: 100, file: new File(content ? [content] : [], name, { type }), altText: description };
			}),
		).then((uploads) => !cancelled && uploads.forEach((upload) => composer.uploads.add(upload)));

		return () => {
			cancelled = true;
		};
	}, [editing, composer, getMediaUrl]);

	const stop = useCallback(() => {
		scheduledMessageEditing.stop({ rid, tmid });
		composer?.clear();
		composer?.uploads.clear();
	}, [rid, tmid, composer]);

	const save = useCallback(
		async (text: string) => {
			if (!editing) {
				return;
			}
			const files = toScheduledFiles(composer?.uploads.get() ?? []);
			try {
				await updateScheduledMessage({
					scheduledMessageId: editing.scheduledMessageId,
					msg: text,
					...((editing.files?.length || files.length) && { files }),
				});
				stop();
				dispatchToastMessage({ type: 'success', message: t('Scheduled_message_updated') });
				void queryClient.invalidateQueries({ queryKey: scheduledMessagesQueryKeys.all });
			} catch (error) {
				if ((error as { error?: string })?.error !== 'error-scheduled-message-not-found') {
					dispatchToastMessage({ type: 'error', message: error });
					return;
				}
				scheduledMessageEditing.stop({ rid, tmid });
				editing.files?.forEach(({ _id }) => composer?.uploads.removeUpload(_id));
				setModal(
					<GenericModal
						variant='warning'
						title={t('Scheduled_message_already_sent')}
						confirmText={t('Send_now')}
						cancelText={t('Discard')}
						onConfirm={() => {
							setModal(null);
							composer?.clear();
							sendAsNew(text);
						}}
						onCancel={() => {
							setModal(null);
							composer?.clear();
						}}
						onClose={() => setModal(null)}
					>
						{t('Scheduled_message_already_sent_description')}
					</GenericModal>,
				);
			}
		},
		[editing, updateScheduledMessage, stop, dispatchToastMessage, t, queryClient, rid, tmid, setModal, composer, sendAsNew],
	);

	const handleSend = (text: string) => {
		if (!editing) {
			return false;
		}
		void save(text);
		return true;
	};

	const handleClose = (event: { preventDefault: () => void }) => {
		if (!editing) {
			return false;
		}
		event.preventDefault();
		stop();
		return true;
	};

	return { editing, save, handleSend, handleClose };
};
