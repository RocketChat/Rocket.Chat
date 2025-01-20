import { TextInput, Box, Select, InputBox } from '@rocket.chat/fuselage';
import { useEffectEvent, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useMethod } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import type { Dispatch, FormEvent, Key, SetStateAction } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import AutoCompleteAgent from '../../../components/AutoCompleteAgent';
import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import GenericModal from '../../../components/GenericModal';
import { CurrentChatTags } from '../additionalForms';
import Label from './Label';
import RemoveAllClosed from './RemoveAllClosed';

type FilterByTextTypeProps = {
	setFilter: Dispatch<SetStateAction<Record<string, any>>>;
	setCustomFields: Dispatch<SetStateAction<{ [key: string]: string } | undefined>>;
	customFields: { [key: string]: string } | undefined;
	hasCustomFields: boolean;
	reload?: () => void;
};

const FilterByText = ({ setFilter, reload, customFields, setCustomFields, hasCustomFields, ...props }: FilterByTextTypeProps) => {
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const statusOptions: [string, string][] = [
		['all', t('All')],
		['closed', t('Closed')],
		['opened', t('Room_Status_Open')],
		['onhold', t('On_Hold_Chats')],
		['queued', t('Queued')],
	];

	const [guest, setGuest] = useLocalStorage('guest', '');
	const [servedBy, setServedBy] = useLocalStorage('servedBy', 'all');
	const [status, setStatus] = useLocalStorage('status', 'all');
	const [department, setDepartment] = useLocalStorage<string>('department', 'all');
	const [from, setFrom] = useLocalStorage('from', '');
	const [to, setTo] = useLocalStorage('to', '');
	const [tags, setTags] = useLocalStorage<never | { label: string; value: string }[]>('tags', []);

	const handleGuest = useEffectEvent((e: FormEvent<HTMLInputElement>) => setGuest(e.currentTarget.value));
	const handleServedBy = useEffectEvent((e: string) => setServedBy(e));
	const handleStatus = useEffectEvent((e: Key) => setStatus(e as string));
	const handleDepartment = useEffectEvent((e: string) => setDepartment(e));
	const handleFrom = useEffectEvent((e: FormEvent<HTMLInputElement>) => setFrom(e.currentTarget.value));
	const handleTo = useEffectEvent((e: FormEvent<HTMLInputElement>) => setTo(e.currentTarget.value));
	const handleTags = useEffectEvent((e: { label: string; value: string }[]) => setTags(e));

	const reset = useEffectEvent(() => {
		setGuest('');
		setServedBy('all');
		setStatus('all');
		setDepartment('all');
		setFrom('');
		setTo('');
		setTags([]);
		setCustomFields(undefined);
	});

	const onSubmit = useEffectEvent((e: FormEvent) => e.preventDefault());

	useEffect(() => {
		setFilter((data) => ({
			...data,
			guest,
			servedBy,
			status,
			department: department && department !== 'all' ? department : '',
			from: from && moment(new Date(from)).utc().format('YYYY-MM-DDTHH:mm:ss'),
			to: to && moment(new Date(to)).utc().format('YYYY-MM-DDTHH:mm:ss'),
			tags: tags.map((tag) => tag.label),
			customFields,
		}));
	}, [setFilter, guest, servedBy, status, department, from, to, tags, customFields]);

	const handleClearFilters = useEffectEvent(() => {
		reset();
	});

	const removeClosedChats = useMethod('livechat:removeAllClosedRooms');

	const handleRemoveClosed = useEffectEvent(async () => {
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
			<GenericModal
				variant='danger'
				data-qa-id='current-chats-modal-remove-all-closed'
				onConfirm={onDeleteAll}
				onClose={handleClose}
				onCancel={handleClose}
				confirmText={t('Delete')}
			/>,
		);
	});

	return (
		<Box mb={16} is='form' onSubmit={onSubmit} display='flex' flexDirection='column' {...props}>
			<Box display='flex' flexDirection='row' flexWrap='wrap' {...props}>
				<Box display='flex' mie={8} flexGrow={1} flexDirection='column'>
					<Label mb={4}>{t('Guest')}</Label>
					<TextInput placeholder={t('Guest')} onChange={handleGuest} value={guest} data-qa='current-chats-guest' />
				</Box>
				<Box display='flex' mie={8} flexGrow={1} flexDirection='column' data-qa='current-chats-servedBy'>
					<Label mb={4}>{t('Served_By')}</Label>
					<AutoCompleteAgent haveAll value={servedBy} onChange={handleServedBy} />
				</Box>
				<Box display='flex' mie={8} flexGrow={1} flexDirection='column'>
					<Label mb={4} id='current-chats-status'>
						{t('Status')}
					</Label>
					<Select
						options={statusOptions}
						value={status}
						onChange={handleStatus}
						placeholder={t('Status')}
						aria-labelledby='current-chats-status'
						data-qa='current-chats-status'
					/>
				</Box>
				<Box display='flex' mie={8} flexGrow={0} flexDirection='column'>
					<Label mb={4}>{t('From')}</Label>
					<InputBox type='date' placeholder={t('From')} onChange={handleFrom} value={from} data-qa='current-chats-from' color='default' />
				</Box>
				<Box display='flex' mie={8} flexGrow={0} flexDirection='column'>
					<Label mb={4}>{t('To')}</Label>
					<InputBox type='date' placeholder={t('To')} onChange={handleTo} value={to} data-qa='current-chats-to' color='default' />
				</Box>

				<RemoveAllClosed
					handleClearFilters={handleClearFilters}
					handleRemoveClosed={handleRemoveClosed}
					hasCustomFields={hasCustomFields}
				/>
			</Box>
			<Box display='flex' marginBlockStart={8} flexGrow={1} flexDirection='column'>
				<Box display='flex' mie={8} flexGrow={1} flexDirection='column'>
					<Label mb={4}>{t('Department')}</Label>
					<AutoCompleteDepartment haveAll showArchived value={department} onChange={handleDepartment} onlyMyDepartments />
				</Box>
			</Box>
			{CurrentChatTags && (
				<Box display='flex' flexDirection='row' marginBlockStart={8} {...props}>
					<Box display='flex' mie={8} flexGrow={1} flexDirection='column' data-qa='current-chats-tags'>
						<Label mb={4}>{t('Tags')}</Label>
						<CurrentChatTags value={tags} handler={handleTags} viewAll />
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default FilterByText;
