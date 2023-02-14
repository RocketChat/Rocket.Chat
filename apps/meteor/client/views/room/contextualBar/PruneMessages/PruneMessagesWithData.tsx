import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useUserRoom, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import type { ReactElement } from 'react';
import React, { useCallback, useEffect, useState } from 'react';

import GenericModal from '../../../../components/GenericModal';
import { useForm } from '../../../../hooks/useForm';
import type { ToolboxContextValue } from '../../contexts/ToolboxContext';
import PruneMessages from './PruneMessages';

const getTimeZoneOffset = (): string => {
	const offset = new Date().getTimezoneOffset();
	const absOffset = Math.abs(offset);
	return `${offset < 0 ? '+' : '-'}${`00${Math.floor(absOffset / 60)}`.slice(-2)}:${`00${absOffset % 60}`.slice(-2)}`;
};

export const initialValues = {
	newerDate: '',
	newerTime: '',
	olderDate: '',
	olderTime: '',
	users: [] as IUser['username'][],
	inclusive: false,
	pinned: false,
	discussion: false,
	threads: false,
	attached: false,
};

const DEFAULT_PRUNE_LIMIT = 2000;

const PruneMessagesWithData = ({ rid, tabBar }: { rid: IRoom['_id']; tabBar: ToolboxContextValue['tabBar'] }): ReactElement => {
	const t = useTranslation();
	const room = useUserRoom(rid);
	const setModal = useSetModal();
	const onClickClose = useMutableCallback(() => tabBar?.close());
	const closeModal = useCallback(() => setModal(null), [setModal]);
	const dispatchToastMessage = useToastMessageDispatch();
	const pruneMessagesAction = useEndpoint('POST', '/v1/rooms.cleanHistory');

	const [fromDate, setFromDate] = useState(new Date('0001-01-01T00:00:00Z'));
	const [toDate, setToDate] = useState(new Date('9999-12-31T23:59:59Z'));
	const [callOutText, setCallOutText] = useState<string | undefined>();
	const [validateText, setValidateText] = useState<string | undefined>();
	const [counter, setCounter] = useState(0);

	const { values, handlers, reset } = useForm(initialValues);
	const { newerDate, newerTime, olderDate, olderTime, users, inclusive, pinned, discussion, threads, attached } =
		values as typeof initialValues;
	const { handleUsers } = handlers;

	const onChangeUsers = useMutableCallback((value: IUser['username'], action?: string) => {
		if (!action) {
			if (users.includes(value)) {
				return;
			}
			return handleUsers([...users, value]);
		}

		return handleUsers(users.filter((current) => current !== value));
	});

	const handlePrune = useMutableCallback((): void => {
		const handlePruneAction = async (): Promise<void> => {
			const limit = DEFAULT_PRUNE_LIMIT;

			try {
				if (counter === limit) {
					return;
				}

				const { count } = await pruneMessagesAction({
					roomId: rid,
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
				closeModal();
				reset();
			} catch (error: unknown) {
				dispatchToastMessage({ type: 'error', message: error });
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
					sprintf: [filesOrMessages, room && isDirectMessageRoom(room) && (room.name || room.usernames?.join(' x '))],
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

		setValidateText(undefined);
	}, [newerDate, olderDate, fromDate, toDate, attached, t, pinned, users, room]);

	return (
		<PruneMessages
			callOutText={callOutText}
			validateText={validateText}
			users={users}
			onChangeUsers={onChangeUsers}
			values={values}
			handlers={handlers}
			onClickClose={onClickClose}
			onClickPrune={handlePrune}
		/>
	);
};

export default PruneMessagesWithData;
