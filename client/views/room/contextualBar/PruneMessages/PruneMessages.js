import React, { useCallback, useEffect, useState } from 'react';
import { Field, ButtonGroup, Button, CheckBox, InputBox, Box, Margins, Callout } from '@rocket.chat/fuselage';
import { useMutableCallback, useUniqueId } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';

import UserAutoCompleteMultiple from '../../../../../ee/client/audit/UserAutoCompleteMultiple';
import { useTranslation } from '../../../../contexts/TranslationContext';
import VerticalBar from '../../../../components/VerticalBar';
import { useUserRoom } from '../../../../contexts/UserContext';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useSetModal } from '../../../../contexts/ModalContext';
import { useForm } from '../../../../hooks/useForm';
import { useMethod } from '../../../../contexts/ServerContext';
import DeleteWarningModal from '../../../../components/DeleteWarningModal';

const getTimeZoneOffset = function() {
	const offset = new Date().getTimezoneOffset();
	const absOffset = Math.abs(offset);
	return `${ offset < 0 ? '+' : '-' }${ `00${ Math.floor(absOffset / 60) }`.slice(-2) }:${ `00${ absOffset % 60 }`.slice(-2) }`;
};

export const DialogPruneMessages = ({ children, ...props }) =>
	<DeleteWarningModal {...props}><Box textAlign='center' fontScale='s1'>{children}</Box></DeleteWarningModal>;

export const DateTimeRow = ({
	label,
	dateTime,
	handleDateTime,
}) => (
	<Field >
		<Field.Label flexGrow={0}>{label}</Field.Label>
		<Box display='flex' mi='neg-x4'>
			<Margins inline='x4'>
				<InputBox type='date' value={dateTime?.date} onChange={handleDateTime?.date} flexGrow={1} h='x20'/>
				<InputBox type='time' value={dateTime?.time} onChange={handleDateTime?.time} flexGrow={1} h='x20'/>
			</Margins>
		</Box>
	</Field>
);

export const PruneMessages = ({
	callOutText,
	validateText,
	newerDateTime,
	handleNewerDateTime,
	olderDateTime,
	handleOlderDateTime,
	users,
	inclusive,
	pinned,
	discussion,
	threads,
	attached,
	handleInclusive,
	handlePinned,
	handleDiscussion,
	handleThreads,
	handleAttached,
	onClickClose,
	onClickPrune,
	onChangeUsers,
}) => {
	const t = useTranslation();

	const inclusiveCheckboxId = useUniqueId();
	const pinnedCheckboxId = useUniqueId();
	const discussionCheckboxId = useUniqueId();
	const threadsCheckboxId = useUniqueId();
	const attachedCheckboxId = useUniqueId();

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='eraser' />
				<VerticalBar.Text>{t('Prune_Messages')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<DateTimeRow label={t('Newer_than')} dateTime={newerDateTime} handleDateTime={handleNewerDateTime} />
				<DateTimeRow label={t('Older_than')} dateTime={olderDateTime} handleDateTime={handleOlderDateTime} />

				<Field >
					<Field.Label flexGrow={0}>{t('Only_from_users')}</Field.Label>
					<UserAutoCompleteMultiple value={users} onChange={onChangeUsers} placeholder={t('Please_enter_usernames')} />
				</Field>

				<Field>
					<Field.Row>
						<CheckBox id={inclusiveCheckboxId} checked={inclusive} onChange={handleInclusive} />
						<Field.Label htmlFor={inclusiveCheckboxId}>{t('Inclusive')}</Field.Label>
					</Field.Row>
				</Field>

				<Field>
					<Field.Row>
						<CheckBox id={pinnedCheckboxId} checked={pinned} onChange={handlePinned} />
						<Field.Label htmlFor={pinnedCheckboxId}>{t('RetentionPolicy_DoNotPrunePinned')}</Field.Label>
					</Field.Row>
				</Field>

				<Field>
					<Field.Row>
						<CheckBox id={discussionCheckboxId} checked={discussion} onChange={handleDiscussion} />
						<Field.Label htmlFor={discussionCheckboxId}>{t('RetentionPolicy_DoNotPruneDiscussion')}</Field.Label>
					</Field.Row>
				</Field>

				<Field>
					<Field.Row>
						<CheckBox id={threadsCheckboxId} checked={threads} onChange={handleThreads} />
						<Field.Label htmlFor={threadsCheckboxId}>{t('RetentionPolicy_DoNotPruneThreads')}</Field.Label>
					</Field.Row>
				</Field>

				<Field>
					<Field.Row>
						<CheckBox id={attachedCheckboxId} checked={attached} onChange={handleAttached} />
						<Field.Label htmlFor={attachedCheckboxId}>{t('Files_only')}</Field.Label>
					</Field.Row>
				</Field>

				{callOutText && !validateText && <Callout type='warning'>{callOutText}</Callout>}
				{validateText && <Callout type='warning'>{validateText}</Callout>}
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button primary danger disabled={validateText && true} onClick={onClickPrune}>{t('Prune')}</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
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

export default ({
	rid,
	tabBar,
}) => {
	const t = useTranslation();
	const room = useUserRoom(rid);
	room.type = room.t;
	room.rid = rid;
	const { name } = room;

	const setModal = useSetModal();
	const onClickClose = useMutableCallback(() => tabBar && tabBar.close());
	const closeModal = useCallback(() => setModal(null), [setModal]);
	const dispatchToastMessage = useToastMessageDispatch();
	const pruneMessages = useMethod('cleanRoomHistory');

	const [fromDate, setFromDate] = useState(new Date('0001-01-01T00:00:00Z'));
	const [toDate, setToDate] = useState(new Date('9999-12-31T23:59:59Z'));
	const [callOutText, setCallOutText] = useState();
	const [validateText, setValidateText] = useState();
	const [count, setCount] = useState(0);

	const { values, handlers, reset } = useForm(initialValues);
	const {
		newerDate,
		newerTime,
		olderDate,
		olderTime,
		users,
		inclusive,
		pinned,
		discussion,
		threads,
		attached,
	} = values;

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
		let result;

		try {
			if (count === limit) {
				return;
			}

			result = await pruneMessages({ roomId: rid, latest: toDate, oldest: fromDate, inclusive, limit, excludePinned: pinned, ignoreDiscussion: discussion, filesOnly: attached, fromUsers: users, ignoreThreads: threads });
			setCount(result);

			if (result < 1) {
				throw new Error(t('No_messages_found_to_prune'));
			}

			dispatchToastMessage({ type: 'success', message: `${ result } ${ t('messages_pruned') }` });
			closeModal();
			reset();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			closeModal();
		}
	});

	const handleModal = () => {
		setModal(<DialogPruneMessages
			onCancel={closeModal}
			onDelete={handlePrune}
			deleteText={t('Yes_prune_them')}
		>{t('Prune_Modal')}</DialogPruneMessages>);
	};

	useEffect(() => {
		if (newerDate) {
			setFromDate(new Date(`${ newerDate }T${ newerTime || '00:00' }:00${ getTimeZoneOffset() }`));
		}

		if (olderDate) {
			setToDate(new Date(`${ olderDate }T${ olderTime || '24:00' }:00${ getTimeZoneOffset() }`));
		}
	}, [newerDate, newerTime, olderDate, olderTime]);

	useEffect(() => {
		const exceptPinned = pinned ? ` ${ t('except_pinned', {}) }` : '';
		const ifFrom = users.length ? ` ${ t('if_they_are_from', {
			postProcess: 'sprintf',
			sprintf: [users.map((element) => element).join(', ')],
		}) }` : '';
		const filesOrMessages = t(attached ? 'files' : 'messages', {});

		if (newerDate && olderDate) {
			setCallOutText(t('Prune_Warning_between', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, name, moment(fromDate).format('L LT'), moment(toDate).format('L LT')],
			}) + exceptPinned + ifFrom);
		} else if (newerDate) {
			setCallOutText(t('Prune_Warning_after', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, name, moment(fromDate).format('L LT')],
			}) + exceptPinned + ifFrom);
		} else if (olderDate) {
			setCallOutText(t('Prune_Warning_before', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, name, moment(toDate).format('L LT')],
			}) + exceptPinned + ifFrom);
		} else {
			setCallOutText(t('Prune_Warning_all', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, name],
			}) + exceptPinned + ifFrom);
		}

		if (fromDate > toDate) {
			return setValidateText(t('Newer_than_may_not_exceed_Older_than', {
				postProcess: 'sprintf',
				sprintf: [],
			}));
		}
		if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
			return setValidateText(t('error-invalid-date', {
				postProcess: 'sprintf',
				sprintf: [],
			}));
		}

		setValidateText();
	}, [newerDate, olderDate, fromDate, toDate, attached, name, t, pinned, users]);

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
