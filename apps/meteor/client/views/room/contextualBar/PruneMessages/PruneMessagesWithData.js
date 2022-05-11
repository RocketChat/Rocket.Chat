import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useUserRoom, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react';

import GenericModal from '../../../../components/GenericModal';
import { useForm } from '../../../../hooks/useForm';
import PruneMessages from './PruneMessages';

const getTimeZoneOffset = function () {
	const offset = new Date().getTimezoneOffset();
	const absOffset = Math.abs(offset);
	return `${offset < 0 ? '+' : '-'}${`00${Math.floor(absOffset / 60)}`.slice(-2)}:${`00${absOffset % 60}`.slice(-2)}`;
};

const initialValues = {
	newerDate: '',
	newerTime: '',
	olderDate: '',
	olderTime: '',
	users: [],
	inclusive: false,
	pinned: false,
	discussion: false,
	threads: false,
	attached: false,
};

const PruneMessagesWithData = ({ rid, tabBar }) => {
	const t = useTranslation();
	const room = useUserRoom(rid);
	room.type = room.t;
	room.rid = rid;
	const { name, usernames } = room;

	const setModal = useSetModal();
	const onClickClose = useMutableCallback(() => tabBar && tabBar.close());
	const closeModal = useCallback(() => setModal(null), [setModal]);
	const dispatchToastMessage = useToastMessageDispatch();
	const pruneMessages = useEndpoint('POST', 'rooms.cleanHistory');

	const [fromDate, setFromDate] = useState(new Date('0001-01-01T00:00:00Z'));
	const [toDate, setToDate] = useState(new Date('9999-12-31T23:59:59Z'));
	const [callOutText, setCallOutText] = useState();
	const [validateText, setValidateText] = useState();
	const [counter, setCounter] = useState(0);

	const { values, handlers, reset } = useForm(initialValues);
	const { newerDate, newerTime, olderDate, olderTime, users, inclusive, pinned, discussion, threads, attached } = values;

	const {
		handleNewerDate,
		handleNewerTime,
		handleOlderDate,
		handleOlderTime,
		handleUsers,
		handleInclusive,
		handlePinned,
		handleDiscussion,
		handleThreads,
		handleAttached,
	} = handlers;

	const onChangeUsers = useMutableCallback((value, action) => {
		if (!action) {
			if (users.includes(value)) {
				return;
			}
			return handleUsers([...users, value]);
		}
		handleUsers(users.filter((current) => current !== value));
	});

	const handlePrune = useMutableCallback(async () => {
		const limit = 2000;

		try {
			if (counter === limit) {
				return;
			}

			const { count } = await pruneMessages({
				roomId: rid,
				latest: toDate,
				oldest: fromDate,
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

			dispatchToastMessage({ type: 'success', message: `${count} ${t('messages_pruned')}` });
			closeModal();
			reset();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error.message });
			closeModal();
		}
	});

	const handleModal = () => {
		setModal(
			<GenericModal variant='danger' onClose={closeModal} onCancel={closeModal} onConfirm={handlePrune} confirmText={t('Yes_prune_them')}>
				{t('Prune_Modal')}
			</GenericModal>,
		);
	};

	useEffect(() => {
		if (newerDate) {
			setFromDate(new Date(`${newerDate}T${newerTime || '00:00'}:00${getTimeZoneOffset()}`));
		}

		if (olderDate) {
			setToDate(new Date(`${olderDate}T${olderTime || '24:00'}:00${getTimeZoneOffset()}`));
		}
	}, [newerDate, newerTime, olderDate, olderTime]);

	useEffect(() => {
		const exceptPinned = pinned ? ` ${t('except_pinned', {})}` : '';
		const ifFrom = users.length
			? ` ${t('if_they_are_from', {
					postProcess: 'sprintf',
					sprintf: [users.map((element) => element).join(', ')],
			  })}`
			: '';
		const filesOrMessages = t(attached ? 'files' : 'messages', {});

		if (newerDate && olderDate) {
			setCallOutText(
				t('Prune_Warning_between', {
					postProcess: 'sprintf',
					sprintf: [filesOrMessages, name, moment(fromDate).format('L LT'), moment(toDate).format('L LT')],
				}) +
					exceptPinned +
					ifFrom,
			);
		} else if (newerDate) {
			setCallOutText(
				t('Prune_Warning_after', {
					postProcess: 'sprintf',
					sprintf: [filesOrMessages, name, moment(fromDate).format('L LT')],
				}) +
					exceptPinned +
					ifFrom,
			);
		} else if (olderDate) {
			setCallOutText(
				t('Prune_Warning_before', {
					postProcess: 'sprintf',
					sprintf: [filesOrMessages, name, moment(toDate).format('L LT')],
				}) +
					exceptPinned +
					ifFrom,
			);
		} else {
			setCallOutText(
				t('Prune_Warning_all', {
					postProcess: 'sprintf',
					sprintf: [filesOrMessages, name || usernames?.join(' x ')],
				}) +
					exceptPinned +
					ifFrom,
			);
		}

		if (fromDate > toDate) {
			return setValidateText(
				t('Newer_than_may_not_exceed_Older_than', {
					postProcess: 'sprintf',
					sprintf: [],
				}),
			);
		}
		if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
			return setValidateText(
				t('error-invalid-date', {
					postProcess: 'sprintf',
					sprintf: [],
				}),
			);
		}

		setValidateText();
	}, [newerDate, olderDate, fromDate, toDate, attached, name, t, pinned, users, usernames]);

	return (
		<PruneMessages
			callOutText={callOutText}
			validateText={validateText}
			newerDateTime={{ date: newerDate, time: newerTime }}
			handleNewerDateTime={{ date: handleNewerDate, time: handleNewerTime }}
			olderDateTime={{ date: olderDate, time: olderTime }}
			handleOlderDateTime={{ date: handleOlderDate, time: handleOlderTime }}
			users={users}
			inclusive={inclusive}
			pinned={pinned}
			discussion={discussion}
			threads={threads}
			attached={attached}
			handleInclusive={handleInclusive}
			handlePinned={handlePinned}
			handleDiscussion={handleDiscussion}
			handleThreads={handleThreads}
			handleAttached={handleAttached}
			onClickClose={onClickClose}
			onClickPrune={handleModal}
			onChangeUsers={onChangeUsers}
		/>
	);
};

export default PruneMessagesWithData;
