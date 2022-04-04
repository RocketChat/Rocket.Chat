import { TextInput, Box, Select, InputBox } from '@rocket.chat/fuselage';
import { useMutableCallback, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';
import React, { Dispatch, FC, SetStateAction, useEffect, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { hasAtLeastOnePermission } from '../../../../app/authorization/client';
import { ILivechatCustomField } from '../../../../definition/ILivechatCustomField';
import AutoCompleteAgent from '../../../components/AutoCompleteAgent';
import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import CustomFieldsForm from '../../../components/CustomFieldsForm';
import GenericModal from '../../../components/GenericModal';
import VerticalBar from '../../../components/VerticalBar';
import { useSetModal } from '../../../contexts/ModalContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { formsSubscription } from '../additionalForms';
import ExtraOptions from './ExtraOptions';
import Label from './Label';

type FilterByTextType = FC<{
	setFilter: Dispatch<SetStateAction<any>>;
	reload?: () => void;
}>;

type CustomFieldsData = Record<string, Pick<ILivechatCustomField, 'label' | 'type' | 'required' | 'defaultValue'> & { options?: string[] }>;

const FilterByText: FilterByTextType = ({ setFilter, reload, ...props }) => {
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
	const [customFields, setCustomFields] = useLocalStorage<{}>('customFields', {});
	const [customFieldsSearchBarOpen, setCustomFieldsSearchBarOpen] = useLocalStorage<boolean>('customFieldsFilterOpen', false);

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
		setCustomFields({});
	});

	const forms = useSubscription<any>(formsSubscription);

	const { useCurrentChatTags = (): void => undefined } = forms;

	const Tags = useCurrentChatTags();

	const onSubmit = useMutableCallback((e) => e.preventDefault());

	const handleCustomFieldsFilterToggle = (): void => setCustomFieldsSearchBarOpen(true);

	const { value: allCustomFieldsDefinition, phase: stateCustomFields } = useEndpointData('livechat/custom-fields');

	const jsonConverterToValidFormat = (customFields: Omit<ILivechatCustomField, '_updatedAt'>[]): CustomFieldsData => {
		const jsonObj: CustomFieldsData = {};
		customFields.forEach(({ _id, label, visibility, options, scope, required }) => {
			if (visibility === 'visible' && scope === 'room') {
				const optionsArrayWithClearFilterOption = options
					? options
							.split(',')
							.map((item) => item.trim())
							.filter((item) => item)
					: [];
				optionsArrayWithClearFilterOption.length && optionsArrayWithClearFilterOption.unshift(t('None_no_option_selected'));
				jsonObj[_id] = {
					label,
					type: options ? 'select' : 'text',
					required,
					defaultValue: options ? t('None_no_option_selected') : '',
					...(optionsArrayWithClearFilterOption.length && {
						options: optionsArrayWithClearFilterOption,
					}),
				};
			}
		});
		return jsonObj;
	};

	const jsonCustomField = useMemo(
		() => (allCustomFieldsDefinition?.customFields ? jsonConverterToValidFormat(allCustomFieldsDefinition.customFields) : {}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[allCustomFieldsDefinition],
	);

	const handleCustomFields = useMutableCallback((newCustomFields: Record<string, string>) => {
		setCustomFields(newCustomFields);
	});

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

	const canViewCustomFields = hasAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields']);

	if ([stateCustomFields].includes(AsyncStatePhase.LOADING)) {
		return <>{t('Loading')}</>;
	}

	return (
		<Box mb='x16' is='form' onSubmit={onSubmit} display='flex' flexDirection='column' {...props}>
			<Box display='flex' flexDirection='row' flexWrap='wrap' {...props}>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Guest')}</Label>
					<TextInput flexShrink={0} placeholder={t('Guest')} onChange={handleGuest} value={guest} />
				</Box>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Served_By')}</Label>
					<AutoCompleteAgent haveAll value={servedBy} onChange={handleServedBy} />
				</Box>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Status')}</Label>
					<Select flexShrink={0} options={statusOptions} value={status} onChange={handleStatus} placeholder={t('Status')} />
				</Box>
				<Box display='flex' mie='x8' flexGrow={0} flexDirection='column'>
					<Label mb='x4'>{t('From')}</Label>
					<InputBox type='date' flexShrink={0} placeholder={t('From')} onChange={handleFrom} value={from} />
				</Box>
				<Box display='flex' mie='x8' flexGrow={0} flexDirection='column'>
					<Label mb='x4'>{t('To')}</Label>
					<InputBox type='date' flexShrink={0} placeholder={t('To')} onChange={handleTo} value={to} />
				</Box>

				<ExtraOptions
					handleClearFilters={handleClearFilters}
					handleRemoveClosed={handleRemoveClosed}
					handleCustomFieldsFilterToggle={handleCustomFieldsFilterToggle}
					canViewCustomFields={canViewCustomFields}
				/>
			</Box>
			<Box display='flex' marginBlockStart='x8' flexGrow={1} flexDirection='column'>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Department')}</Label>
					<AutoCompleteDepartment haveAll value={department} onChange={handleDepartment} label={t('All')} onlyMyDepartments />
				</Box>
			</Box>
			{Tags && (
				<Box display='flex' flexDirection='row' marginBlockStart='x8' {...props}>
					<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
						<Label mb='x4'>{t('Tags')}</Label>
						<Tags value={tags} handler={handleTags} />
					</Box>
				</Box>
			)}
			{customFieldsSearchBarOpen && (
				<VerticalBar overridePosition='absolute'>
					<VerticalBar.Header>
						{t('Filter_by_Custom_Fields')}
						<VerticalBar.Close onClick={(): void => setCustomFieldsSearchBarOpen(false)} />
					</VerticalBar.Header>
					<VerticalBar.ScrollableContent>
						{canViewCustomFields && allCustomFieldsDefinition && (
							<CustomFieldsForm
								jsonCustomFields={jsonCustomField}
								customFieldsData={customFields}
								setCustomFieldsData={(newCustomFields: Record<string, string>): void =>
									newCustomFields && handleCustomFields(newCustomFields)
								}
							/>
						)}
					</VerticalBar.ScrollableContent>
				</VerticalBar>
			)}
		</Box>
	);
};

export default FilterByText;
