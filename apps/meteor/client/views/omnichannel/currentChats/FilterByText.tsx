import { TextInput, Box, Select, InputBox } from '@rocket.chat/fuselage';
import { useMutableCallback, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import React, { Dispatch, FC, SetStateAction, useEffect } from 'react';

import AutoCompleteAgent from '../../../components/AutoCompleteAgent';
import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import GenericModal from '../../../components/GenericModal';
import { useFormsSubscription } from '../additionalForms';
import Label from './Label';
import RemoveAllClosed from './RemoveAllClosed';

type FilterByTextType = FC<{
	setFilter: Dispatch<SetStateAction<any>>;
	setCustomFields: Dispatch<SetStateAction<{ [key: string]: string } | undefined>>;
	customFields: { [key: string]: string } | undefined;
	hasCustomFields: boolean;
	reload?: () => void;
}>;

const FilterByText: FilterByTextType = ({ setFilter, reload, customFields, setCustomFields, hasCustomFields, ...props }) => {
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const statusOptions: [string, string][] = [
		['all', t('All')],
		['closed', t('Closed')],
		['opened', t('Open')],
		['onhold', t('On_Hold_Chats')],
	];

	const [guest, setGuest] = useLocalStorage('guest', '');
	const [servedBy, setServedBy] = useLocalStorage('servedBy', 'all');
	const [status, setStatus] = useLocalStorage('status', 'all');
	const [department, setDepartment] = useLocalStorage<{ label: string; value: string }>('department', { value: 'all', label: t('All') });
	const [from, setFrom] = useLocalStorage('from', '');
	const [to, setTo] = useLocalStorage('to', '');
	const [tags, setTags] = useLocalStorage<never | { label: string; value: string }[]>('tags', []);

	const handleGuest = useMutableCallback((e) => setGuest(e.target.value));
	const handleServedBy = useMutableCallback((e) => setServedBy(e));
	const handleStatus = useMutableCallback((e) => setStatus(e));
	const handleDepartment = useMutableCallback((e) => setDepartment(e));
	const handleFrom = useMutableCallback((e) => setFrom(e.target.value));
	const handleTo = useMutableCallback((e) => setTo(e.target.value));
	const handleTags = useMutableCallback((e) => setTags(e));

	const reset = useMutableCallback(() => {
		setGuest('');
		setServedBy('all');
		setStatus('all');
		setDepartment({ value: 'all', label: t('All') });
		setFrom('');
		setTo('');
		setTags([]);
		setCustomFields(undefined);
	});

	const forms = useFormsSubscription() as any;

	// TODO: Refactor the formsSubscription to use components instead of hooks (since the only thing the hook does is return a component)
	// Conditional hook was required since the whole formSubscription uses hooks in an incorrect manner
	const { useCurrentChatTags = (): void => undefined } = forms;

	const EETagsComponent = useCurrentChatTags();

	const onSubmit = useMutableCallback((e) => e.preventDefault());

	useEffect(() => {
		setFilter({
			guest,
			servedBy,
			status,
			...(department?.value && department.value !== 'all' && { department: department.value }),
			from: from && moment(new Date(from)).utc().format('YYYY-MM-DDTHH:mm:ss'),
			to: to && moment(new Date(to)).utc().format('YYYY-MM-DDTHH:mm:ss'),
			tags: tags.map((tag) => tag.label),
			customFields,
		});
	}, [setFilter, guest, servedBy, status, department, from, to, tags, customFields]);

	const handleClearFilters = useMutableCallback(() => {
		reset();
	});

	const removeClosedChats = useMethod('livechat:removeAllClosedRooms');

	const handleRemoveClosed = useMutableCallback(async () => {
		const onDeleteAll = async (): Promise<void> => {
			try {
				await removeClosedChats();
				reload?.();
				dispatchToastMessage({ type: 'success', message: t('Chat_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal(null);
		};

		const handleClose = (): void => {
			setModal(null);
		};

		setModal(
			<GenericModal variant='danger' onConfirm={onDeleteAll} onClose={handleClose} onCancel={handleClose} confirmText={t('Delete')} />,
		);
	});

	return (
		<Box mb='x16' is='form' onSubmit={onSubmit} display='flex' flexDirection='column' {...props}>
			<Box display='flex' flexDirection='row' flexWrap='wrap' {...props}>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Guest')}</Label>
					<TextInput flexShrink={0} placeholder={t('Guest')} onChange={handleGuest} value={guest} data-qa='current-chats-guest' />
				</Box>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column' data-qa='current-chats-servedBy'>
					<Label mb='x4'>{t('Served_By')}</Label>
					<AutoCompleteAgent haveAll value={servedBy} onChange={handleServedBy} />
				</Box>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Status')}</Label>
					<Select
						flexShrink={0}
						options={statusOptions}
						value={status}
						onChange={handleStatus}
						placeholder={t('Status')}
						data-qa='current-chats-status'
					/>
				</Box>
				<Box display='flex' mie='x8' flexGrow={0} flexDirection='column'>
					<Label mb='x4'>{t('From')}</Label>
					<InputBox type='date' flexShrink={0} placeholder={t('From')} onChange={handleFrom} value={from} data-qa='current-chats-from' />
				</Box>
				<Box display='flex' mie='x8' flexGrow={0} flexDirection='column'>
					<Label mb='x4'>{t('To')}</Label>
					<InputBox type='date' flexShrink={0} placeholder={t('To')} onChange={handleTo} value={to} data-qa='current-chats-to' />
				</Box>

				<RemoveAllClosed
					handleClearFilters={handleClearFilters}
					handleRemoveClosed={handleRemoveClosed}
					hasCustomFields={hasCustomFields}
				/>
			</Box>
			<Box display='flex' marginBlockStart='x8' flexGrow={1} flexDirection='column'>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Department')}</Label>
					<AutoCompleteDepartment haveAll value={department} onChange={handleDepartment} label={t('All')} onlyMyDepartments />
				</Box>
			</Box>
			{EETagsComponent && (
				<Box display='flex' flexDirection='row' marginBlockStart='x8' {...props}>
					<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
						<Label mb='x4'>{t('Tags')}</Label>
						<EETagsComponent value={tags} handler={handleTags} />
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default FilterByText;
