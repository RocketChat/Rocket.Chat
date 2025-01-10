import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import PruneMessages from './PruneMessages';
import GenericModal from '../../../../components/GenericModal';
import { useRoom } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

const getTimeZoneOffset = (): string => {
	const offset = new Date().getTimezoneOffset();
	const absOffset = Math.abs(offset);
	return `${offset < 0 ? '+' : '-'}${`00${Math.floor(absOffset / 60)}`.slice(-2)}:${`00${absOffset % 60}`.slice(-2)}`;
};

export const initialValues = {
	newer: {
		date: '',
		time: '',
	},
	older: {
		date: '',
		time: '',
	},
	users: [],
	inclusive: false,
	pinned: false,
	discussion: false,
	threads: false,
	attached: false,
};

const DEFAULT_PRUNE_LIMIT = 2000;

const PruneMessagesWithData = (): ReactElement => {
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
		inclusive,
		pinned,
		discussion,
		threads,
		attached,
	} = methods.watch();

	const fromDate = useMemo(() => {
		return new Date(`${newerDate || '0001-01-01'}T${newerTime || '00:00'}:00${getTimeZoneOffset()}`);
	}, [newerDate, newerTime]);

	const toDate = useMemo(() => {
		return new Date(`${olderDate || '9999-12-31'}T${olderTime || '23:59'}:59${getTimeZoneOffset()}`);
	}, [olderDate, olderTime]);

	const handlePrune = useEffectEvent((): void => {
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
					inclusive,
					limit,
					excludePinned: pinned,
					filesOnly: attached,
					ignoreDiscussion: discussion,
					ignoreThreads: threads,
					users,
				});

				setCounter(count);

				if (count < 1) {
					throw new Error(t('No_messages_found_to_prune'));
				}

				dispatchToastMessage({ type: 'success', message: t('__count__message_pruned', { count }) });
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
				onClose={closeModal}
				onCancel={closeModal}
				onConfirm={handlePruneAction}
				confirmText={t('Yes_prune_them')}
			>
				{t('Prune_Modal')}
			</GenericModal>,
		);
	});

	const callOutText = useMemo(() => {
		const name = room && ((isDirectMessageRoom(room) && room.usernames?.join(' x ')) || room.fname || room.name);
		const exceptPinned = pinned ? ` ${t('except_pinned')}` : '';
		const ifFrom = users.length
			? ` ${t('if_they_are_from', {
					postProcess: 'sprintf',
					sprintf: [users.map((element) => element).join(', ')],
				})}`
			: '';
		const filesOrMessages = attached ? t('files') : t('messages');

		if (newerDate && olderDate) {
			return (
				t('Prune_Warning_between', {
					postProcess: 'sprintf',
					sprintf: [filesOrMessages, name, moment(fromDate).format('L LT'), moment(toDate).format('L LT')],
				}) +
				exceptPinned +
				ifFrom
			);
		}

		if (newerDate) {
			return (
				t('Prune_Warning_after', {
					postProcess: 'sprintf',
					sprintf: [filesOrMessages, name, moment(fromDate).format('L LT')],
				}) +
				exceptPinned +
				ifFrom
			);
		}

		if (olderDate) {
			return (
				t('Prune_Warning_before', {
					postProcess: 'sprintf',
					sprintf: [filesOrMessages, name, moment(toDate).format('L LT')],
				}) +
				exceptPinned +
				ifFrom
			);
		}

		return (
			t('Prune_Warning_all', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, name],
			}) +
			exceptPinned +
			ifFrom
		);
	}, [attached, fromDate, newerDate, olderDate, pinned, room, t, toDate, users]);

	const validateText = useMemo(() => {
		if (fromDate > toDate) {
			return t('Newer_than_may_not_exceed_Older_than');
		}

		if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
			return t('error-invalid-date');
		}

		return undefined;
	}, [fromDate, t, toDate]);

	return (
		<FormProvider {...methods}>
			<PruneMessages callOutText={callOutText} validateText={validateText} users={users} onClickClose={close} onClickPrune={handlePrune} />
		</FormProvider>
	);
};

export default PruneMessagesWithData;
