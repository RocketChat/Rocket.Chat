import { TextInput, Box, Select, InputBox } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { Dispatch, FC, ReactElement, SetStateAction } from 'react';
import { Controller, UseFormRegister, Control } from 'react-hook-form';
import { useSubscription } from 'use-subscription';

import AutoCompleteAgent from '../../../components/AutoCompleteAgent';
import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import GenericModal from '../../../components/GenericModal';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useSetModal } from '../../../contexts/ModalContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { formsSubscription } from '../additionalForms';
import ExtraOptions from './ExtraOptions';
import Label from './Label';

type FilterByTextPropTypes = FC<{
	setFilter: Dispatch<SetStateAction<any>>;
	register: UseFormRegister<Record<string, string>>;
	control: Control;
	reset: () => void;
	reload?: () => void;
}>;

const FilterByText: FilterByTextPropTypes = ({ register, control, reset, ...props }) => {
	console.log('FilterByText');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const canViewCustomFields = usePermission('view-livechat-room-customfields');

	const statusOptions: [string, string][] = [
		['all', t('All')],
		['closed', t('Closed')],
		['opened', t('Open')],
		['onhold', t('On_Hold_Chats')],
	];

	const removeClosedChats = useMethod('livechat:removeAllClosedRooms');

	const handleRemoveClosed = useMutableCallback(async () => {
		const onDeleteAll = async (): Promise<void> => {
			try {
				await removeClosedChats();
				// reload?.();
				dispatchToastMessage({ type: 'success', message: t('Chat_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: (error as Error).message });
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

	const handleClearFilters = useMutableCallback(() => reset());
	const currentChatsRoute = useRoute('omnichannel-current-chats');

	const handleShowCustomFields = useMutableCallback(() => currentChatsRoute.push({ context: 'custom-fields' }));

	const forms = useSubscription<any>(formsSubscription);

	const { useCurrentChatTags = (): void => undefined } = forms;

	const Tags = useCurrentChatTags();

	// guest: '',
	// fname: '',
	// servedBy: '',
	// status: '',
	// department: '',
	// from: '',
	// to: '',
	// customFields: {},
	// current: 0,
	// itemsPerPage: 25,

	return (
		<Box mb='x16' is='form' display='flex' flexDirection='column' {...props}>
			<Box display='flex' flexDirection='row' flexWrap='wrap' {...props}>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Guest')}</Label>
					<TextInput flexShrink={0} placeholder={t('Guest')} {...register('guest')} />
				</Box>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Served_By')}</Label>
					<Controller name='servedBy' control={control} render={({ field }): ReactElement => <AutoCompleteAgent haveAll {...field} />} />
				</Box>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Status')}</Label>
					<Controller
						render={({ field }): ReactElement => <Select flexShrink={0} options={statusOptions} placeholder={t('Status')} {...field} />}
						name='status'
						control={control}
						defaultValue='all'
					/>
				</Box>
				<Box display='flex' mie='x8' flexGrow={0} flexDirection='column'>
					<Label mb='x4'>{t('From')}</Label>
					<InputBox type='date' flexShrink={0} placeholder={t('From')} {...register('from')} />
				</Box>
				<Box display='flex' mie='x8' flexGrow={0} flexDirection='column'>
					<Label mb='x4'>{t('To')}</Label>
					<InputBox type='date' flexShrink={0} placeholder={t('To')} {...register('to')} />
				</Box>
				<ExtraOptions
					handleShowCustomFields={canViewCustomFields ? handleShowCustomFields : undefined}
					handleClearFilters={handleClearFilters}
					handleRemoveClosed={handleRemoveClosed}
				/>
			</Box>
			<Box display='flex' marginBlockStart='x8' flexGrow={1} flexDirection='column'>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Department')}</Label>
					<Controller
						name='department'
						control={control}
						render={({ field }): ReactElement => <AutoCompleteDepartment haveAll onlyMyDepartments {...field} />}
					/>
				</Box>
			</Box>
			{Tags && (
				<Box display='flex' flexDirection='row' marginBlockStart='x8' {...props}>
					<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
						<Label mb='x4'>{t('Tags')}</Label>
						<Tags control={control} />
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default FilterByText;
