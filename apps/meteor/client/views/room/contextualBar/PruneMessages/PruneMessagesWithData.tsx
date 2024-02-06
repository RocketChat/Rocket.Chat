import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import React, { useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import { useRoom } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';
import PruneMessages from './PruneMessages';
import PruneMessagesModal from './PruneMessagesModal';

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

const PruneMessagesWithData = () => {
	const t = useTranslation();
	const room = useRoom();
	const setModal = useSetModal();
	const { closeTab } = useRoomToolbox();

	const methods = useForm({ values: initialValues });

	const {
		newer: { date: newerDate, time: newerTime },
		older: { date: olderDate, time: olderTime },
		users,
		pinned,
		attached,
	} = methods.watch();

	const fromDate = useMemo(() => {
		return new Date(`${newerDate || '0001-01-01'}T${newerTime || '00:00'}:00${getTimeZoneOffset()}`);
	}, [newerDate, newerTime]);

	const toDate = useMemo(() => {
		return new Date(`${olderDate || '9999-12-31'}T${olderTime || '23:59'}:59${getTimeZoneOffset()}`);
	}, [olderDate, olderTime]);

	const handlePrune = (): void => {
		return setModal(
			<FormProvider {...methods}>
				<PruneMessagesModal room={room} fromDate={fromDate} toDate={toDate} />
			</FormProvider>,
		);
	};

	const callOutText = useMemo(() => {
		const exceptPinned = pinned ? ` ${t('except_pinned', {})}` : '';
		const ifFrom = users.length
			? ` ${t('if_they_are_from', {
					postProcess: 'sprintf',
					sprintf: [users.map((element) => element).join(', ')],
			  })}`
			: '';
		const filesOrMessages = t(attached ? 'files' : 'messages', {});

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
				sprintf: [filesOrMessages, room && ((isDirectMessageRoom(room) && room.usernames?.join(' x ')) || room.fname || room.name)],
			}) +
			exceptPinned +
			ifFrom
		);
	}, [attached, fromDate, newerDate, olderDate, pinned, room, t, toDate, users]);

	const validateText = useMemo(() => {
		if (fromDate > toDate) {
			return t('Newer_than_may_not_exceed_Older_than', {
				postProcess: 'sprintf',
				sprintf: [],
			});
		}

		if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
			return t('error-invalid-date', {
				postProcess: 'sprintf',
				sprintf: [],
			});
		}

		return undefined;
	}, [fromDate, t, toDate]);

	return (
		<FormProvider {...methods}>
			<PruneMessages callOutText={callOutText} validateText={validateText} onClickClose={closeTab} onClickPrune={handlePrune} />
		</FormProvider>
	);
};

export default PruneMessagesWithData;
