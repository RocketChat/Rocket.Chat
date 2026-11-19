import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { Stack, Text } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { formatDate, GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useEndpoint, useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import PruneMessages from './PruneMessages';
import { useRoom } from '../../contexts/RoomContext';

type DateTimeValue = { date: string; time: string };

const getFromDate = ({ date, time }: DateTimeValue) => new Date(`${date || '0001-01-01'}T${time || '00:00'}:00`);

const getUntilDate = ({ date, time }: DateTimeValue) => new Date(`${date || '9999-12-31'}T${time || '23:59'}:59.999`);

export const initialValues = {
	newer: {
		date: '',
		time: '',
	},
	older: {
		date: '',
		time: '',
	},
	users: [] as string[],
	content: 'messages',
	deletePinned: true,
	deleteThreads: true,
	deleteDiscussion: true,
	deleteDiscussionOrigin: true,
};

export type PruneMessagesFormValues = typeof initialValues;

const DEFAULT_PRUNE_LIMIT = 2000;

const PruneMessagesWithData = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const setModal = useSetModal();
	const { closeTab: close } = useRoomToolbox();
	const closeModal = useCallback(() => setModal(null), [setModal]);
	const dispatchToastMessage = useToastMessageDispatch();
	const pruneMessagesAction = useEndpoint('POST', '/v1/rooms.cleanHistory');

	const [counter, setCounter] = useState(0);

	const methods = useForm({ defaultValues: initialValues });

	const {
		newer: { date: newerDate, time: newerTime },
		older: { date: olderDate, time: olderTime },
		users,
		content,
		deletePinned,
		deleteThreads,
		deleteDiscussion,
		deleteDiscussionOrigin,
	} = methods.watch();

	const filesOnly = content === 'files';

	const fromDate = useMemo(() => getFromDate({ date: newerDate, time: newerTime }), [newerDate, newerTime]);

	const toDate = useMemo(() => getUntilDate({ date: olderDate, time: olderTime }), [olderDate, olderTime]);

	const validateDateRange = useStableCallback(({ newer, older }: PruneMessagesFormValues) => {
		const from = getFromDate(newer);
		const until = getUntilDate(older);

		if (isNaN(from.getTime()) || isNaN(until.getTime())) {
			return t('error-invalid-date');
		}

		if (from > until) {
			return t('Newer_than_may_not_exceed_Older_than');
		}

		return true;
	});

	const handlePrune = useStableCallback((): void => {
		const handlePruneAction = async () => {
			const limit = DEFAULT_PRUNE_LIMIT;

			try {
				if (counter === limit) {
					return;
				}

				const { count } = await pruneMessagesAction({
					roomId: room._id,
					latest: toDate.toISOString(),
					oldest: fromDate.toISOString(),
					inclusive: true,
					limit,
					excludePinned: !deletePinned,
					filesOnly,
					ignoreDiscussion: !deleteDiscussion,
					ignoreDiscussionOrigin: !deleteDiscussionOrigin,
					ignoreThreads: !deleteThreads,
					users,
				});

				setCounter(count);

				if (count < 1) {
					throw new Error(filesOnly ? t('No_files_found_to_prune') : t('No_messages_found_to_prune'));
				}

				dispatchToastMessage({
					type: 'success',
					message: filesOnly ? t('__count__file_pruned', { count }) : t('__count__message_pruned', { count }),
				});
				methods.reset();
			} catch (error: unknown) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				closeModal();
			}
		};

		return setModal(
			<GenericModal
				variant='danger'
				icon={null}
				title={t('Bulk_delete')}
				onClose={closeModal}
				onCancel={closeModal}
				onConfirm={handlePruneAction}
				confirmText={filesOnly ? t('Delete_files') : t('Delete_messages_and_files')}
				annotation={t('This_cannot_be_undone')}
			>
				<Stack gap='x16'>
					<Text is='p'>
						<Trans i18nKey={summaryKey} values={summaryValues} components={{ bold: <strong /> }} />
					</Text>
					{excludedTypes.length > 0 && (
						<Text is='p'>{t(filesOnly ? 'Bulk_delete_excluding_files' : 'Bulk_delete_excluding', { types: excludedTypes })}</Text>
					)}
				</Stack>
			</GenericModal>,
		);
	});

	const summaryKey = useMemo(() => {
		if (newerDate && olderDate) {
			return 'Bulk_delete_summary_between';
		}
		if (newerDate) {
			return 'Bulk_delete_summary_from';
		}
		if (olderDate) {
			return 'Bulk_delete_summary_until';
		}
		return 'Bulk_delete_summary';
	}, [newerDate, olderDate]);

	const summaryValues = {
		items: filesOnly ? t('Files') : t('Messages_and_files'),
		roomName: room && ((isDirectMessageRoom(room) && room.usernames?.join(' x ')) || room.fname || room.name),
		users: users.length ? users : [t('Bulk_delete_all_users')],
		fromDate: formatDate(fromDate, 'L LT'),
		toDate: formatDate(toDate, 'L LT'),
	};

	const excludedTypes = [
		!deletePinned && t('Bulk_delete_type_pinned'),
		!deleteThreads && t('Bulk_delete_type_thread'),
		!deleteDiscussion && t('Bulk_delete_type_discussion'),
		!deleteDiscussion && !deleteDiscussionOrigin && t('Bulk_delete_type_original_discussion'),
	].filter((type): type is string => Boolean(type));

	return (
		<FormProvider {...methods}>
			<PruneMessages validateDateRange={validateDateRange} onClickClose={close} onSubmit={methods.handleSubmit(handlePrune)} />
		</FormProvider>
	);
};

export default PruneMessagesWithData;
