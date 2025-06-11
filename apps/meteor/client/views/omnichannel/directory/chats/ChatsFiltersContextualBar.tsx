import { Button, ButtonGroup, Field, FieldLabel, FieldRow, InputBox, Select, TextInput } from '@rocket.chat/fuselage';
import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AutoCompleteDepartmentMultiple from '../../../../components/AutoCompleteDepartmentMultiple';
import AutoCompleteMultipleAgent from '../../../../components/AutoCompleteMultipleAgent';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarDialog,
} from '../../../../components/Contextualbar';
import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import AutoCompleteUnits from '../../../../omnichannel/additionalForms/AutoCompleteUnits';
import { CurrentChatTags } from '../../additionalForms';
import type { ChatsFiltersQuery } from '../contexts/ChatsContext';
import { useChatsContext } from '../contexts/ChatsContext';

type ChatsFiltersContextualBarProps = {
	onClose: () => void;
};

const ChatsFiltersContextualBar = ({ onClose }: ChatsFiltersContextualBarProps) => {
	const { t } = useTranslation();
	const canViewLivechatRooms = usePermission('view-livechat-rooms');
	const canViewCustomFields = usePermission('view-livechat-room-customfields');
	const isEnterprise = useHasLicenseModule('livechat-enterprise');

	const allCustomFields = useEndpoint('GET', '/v1/livechat/custom-fields');
	const { data } = useQuery({ queryKey: ['livechat/custom-fields'], queryFn: async () => allCustomFields() });
	const contactCustomFields = data?.customFields.filter((customField) => customField.scope !== 'visitor');

	const { filtersQuery, setFiltersQuery, resetFiltersQuery, hasAppliedFilters } = useChatsContext();

	const { handleSubmit, control, reset } = useForm<ChatsFiltersQuery>({
		values: filtersQuery,
	});

	const statusOptions: [string, string][] = [
		['all', t('All')],
		['closed', t('Closed')],
		['opened', t('Room_Status_Open')],
		['onhold', t('On_Hold_Chats')],
		['queued', t('Queued')],
	];

	const handleSubmitFilters = (data: ChatsFiltersQuery) => setFiltersQuery(({ guest }) => ({ ...data, guest }));

	const handleResetFilters = () => {
		resetFiltersQuery();
		reset();
	};

	const formId = useId();
	const fromFieldId = useId();
	const toFieldId = useId();
	const servedByFieldId = useId();
	const statusFieldId = useId();
	const departmentFieldId = useId();
	const tagsFieldId = useId();
	const unitsFieldId = useId();

	return (
		<ContextualbarDialog onClose={onClose}>
			<ContextualbarHeader>
				<ContextualbarIcon name='customize' />
				<ContextualbarTitle>{t('Filters')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent is='form' id={formId} onSubmit={handleSubmit(handleSubmitFilters)}>
				<Field>
					<FieldLabel htmlFor={fromFieldId}>{t('From')}</FieldLabel>
					<FieldRow>
						<Controller
							name='from'
							control={control}
							render={({ field }) => (
								<InputBox type='date' id={fromFieldId} placeholder={t('From')} max={format(new Date(), 'yyyy-MM-dd')} {...field} />
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel htmlFor={toFieldId}>{t('To')}</FieldLabel>
					<FieldRow>
						<Controller
							name='to'
							control={control}
							render={({ field }) => (
								<InputBox type='date' id={toFieldId} placeholder={t('To')} max={format(new Date(), 'yyyy-MM-dd')} {...field} />
							)}
						/>
					</FieldRow>
				</Field>
				{canViewLivechatRooms && (
					<Field>
						<FieldLabel is='span' id={servedByFieldId}>
							{t('Served_By')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='servedBy'
								control={control}
								render={({ field: { value, onChange } }) => (
									<AutoCompleteMultipleAgent aria-labelledby={servedByFieldId} value={value} onChange={onChange} />
								)}
							/>
						</FieldRow>
					</Field>
				)}
				<Field>
					<FieldLabel is='span' id={statusFieldId}>
						{t('Status')}
					</FieldLabel>
					<Controller
						name='status'
						control={control}
						render={({ field }) => (
							<Select {...field} aria-labelledby={statusFieldId} options={statusOptions} placeholder={t('Select_an_option')} />
						)}
					/>
				</Field>
				<Field>
					<FieldLabel is='span' id={departmentFieldId}>
						{t('Department')}
					</FieldLabel>
					<FieldRow>
						<Controller
							name='department'
							control={control}
							render={({ field: { value, onChange } }) => (
								<AutoCompleteDepartmentMultiple
									aria-labelledby={departmentFieldId}
									showArchived
									value={value}
									onChange={onChange}
									onlyMyDepartments
								/>
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel htmlFor={tagsFieldId}>{t('Tags')}</FieldLabel>
					<FieldRow>
						<Controller
							name='tags'
							control={control}
							render={({ field: { value, onChange } }) => <CurrentChatTags id={tagsFieldId} value={value} handler={onChange} viewAll />}
						/>
					</FieldRow>
				</Field>
				{isEnterprise && (
					<Field>
						<FieldLabel is='span' id={unitsFieldId}>
							{t('Units')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='units'
								control={control}
								render={({ field: { value, onChange } }) => (
									<AutoCompleteUnits aria-labelledby={unitsFieldId} value={value} onChange={onChange} />
								)}
							/>
						</FieldRow>
					</Field>
				)}
				{canViewCustomFields &&
					contactCustomFields?.map((customField) => {
						if (customField.type === 'select') {
							return (
								<Field key={customField._id}>
									<FieldLabel is='span' id={customField._id}>
										{customField.label}
									</FieldLabel>
									<FieldRow>
										<Controller
											name={customField._id}
											control={control}
											render={({ field }) => (
												<Select
													{...field}
													aria-labelledby={customField._id}
													value={field.value as string}
													options={(customField.options || '').split(',').map((item) => [item, item])}
												/>
											)}
										/>
									</FieldRow>
								</Field>
							);
						}

						return (
							<Field key={customField._id}>
								<FieldLabel htmlFor={customField._id}>{customField.label}</FieldLabel>
								<FieldRow>
									<Controller
										name={customField._id}
										control={control}
										render={({ field }) => <TextInput {...field} id={customField._id} value={field.value as string} />}
									/>
								</FieldRow>
							</Field>
						);
					})}
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button disabled={!hasAppliedFilters} onClick={handleResetFilters}>
						{t('Clear_filters')}
					</Button>
					<Button type='submit' form={formId} primary>
						{t('Apply')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</ContextualbarDialog>
	);
};

export default ChatsFiltersContextualBar;
