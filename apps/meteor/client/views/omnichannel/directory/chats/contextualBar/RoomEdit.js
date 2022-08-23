import { Field, TextInput, ButtonGroup, Button, Select } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useMethod, useTranslation, useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import CustomFieldsForm from '../../../../../components/CustomFieldsForm';
import Tags from '../../../../../components/Omnichannel/Tags';
import VerticalBar from '../../../../../components/VerticalBar';
import { useIsEnterprise } from '../../../../../hooks/useIsEnterprise';
import { FormSkeleton } from '../../Skeleton';
import { useCustomFields } from './hooks/useCustomFields';
import { usePriorities } from './hooks/usePriorities';

const CUSTOM_FIELDS_PERMISSION = ['view-livechat-room-customfields', 'edit-livechat-room-customfields'];
const DEFAULT_VALUES = {
	topic: '',
	tags: [],
	livechatData: {},
	priorityId: '',
};

const getInitialValuesRoom = (room) => {
	if (!room) {
		return DEFAULT_VALUES;
	}

	return {
		topic: room.topic ?? '',
		tags: room.tags ?? [],
		livechatData: room.livechatData ?? {},
		priorityId: room.priorityId ?? '',
	};
};

const jsonConverterToValidFormat = (customFields) => {
	const jsonObj = {};
	customFields.forEach(({ _id, label, visibility, options, scope, defaultValue, required }) => {
		(visibility === 'visible') & (scope === 'room') &&
			(jsonObj[_id] = {
				label,
				type: options ? 'select' : 'text',
				required,
				defaultValue,
				options: options && options.split(',').map((item) => item.trim()),
			});
	});

	return jsonObj;
};

const RoomEdit = ({ room, visitor, reload, reloadInfo, close }) => {
	const t = useTranslation();

	const isEnterprise = useIsEnterprise();
	const viewCustomFields = useAtLeastOnePermission(CUSTOM_FIELDS_PERMISSION);
	const dispatchToastMessage = useToastMessageDispatch();
	const saveRoom = useMethod('livechat:saveInfo');

	const [customFieldsErrors, setCustomFieldsErrors] = useState([]);

	const {
		control,
		register,
		getValues,
		formState: { isDirty },
	} = useForm({ defaultValues: getInitialValuesRoom(room) });

	const { data: customFieldsData, isError: customFieldsError, isLoading: customFieldsLoading } = useCustomFields();
	const { data: prioritiesData, isError: prioritiesError, isLoading: prioritiesLoading } = usePriorities();

	const jsonCustomField = useMemo(
		() => (customFieldsData?.customFields ? jsonConverterToValidFormat(customFieldsData.customFields) : {}),
		[customFieldsData],
	);

	const handleSubmit = useCallback(async () => {
		const values = getValues();
		const guestData = { _id: visitor._id };

		const roomData = {
			_id: room._id,
			topic: values.topic,
			tags: values.tags.sort(),
			livechatData: values.livechatData,
			...(values.priorityId && { priorityId: values.priorityId }),
		};

		try {
			saveRoom(guestData, roomData);

			dispatchToastMessage({ type: 'success', message: t('Saved') });

			reload && reload();
			reloadInfo && reloadInfo();

			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [close, dispatchToastMessage, getValues, reload, reloadInfo, room._id, saveRoom, t, visitor._id]);

	if (!customFieldsData || !prioritiesData || customFieldsLoading || customFieldsError || prioritiesLoading || prioritiesError) {
		return <FormSkeleton />;
	}

	return (
		<>
			<VerticalBar.ScrollableContent is='form'>
				{viewCustomFields && (
					<Controller
						control={control}
						name='livechatData'
						render={({ field: { name, value, onChange } }) => (
							<CustomFieldsForm
								name={name}
								jsonCustomFields={jsonCustomField}
								customFieldsData={value}
								setCustomFieldsData={onChange}
								setCustomFieldsError={(errors) => {
									setCustomFieldsErrors(errors);
								}}
							/>
						)}
					/>
				)}
				<Field>
					<Field.Label>{t('Topic')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} {...register('topic')} />
					</Field.Row>
				</Field>
				<Field>
					<Controller
						control={control}
						name='tags'
						render={({ field: { name, value, onChange } }) => <Tags name={name} tags={value} handler={onChange} />}
					/>
				</Field>
				{isEnterprise && (
					<Field>
						<Field.Label>{t('Priority')}</Field.Label>
						<Field.Row>
							<Controller
								control={control}
								name='priorityId'
								render={({ field: { name, value, onChange } }) => (
									<Select
										name={name}
										value={value}
										options={prioritiesData.priorities.map((priority) => [priority._id, priority.name])}
										onChange={onChange}
									/>
								)}
							/>
						</Field.Row>
					</Field>
				)}
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button flexGrow={1} onClick={close}>
						{t('Cancel')}
					</Button>
					<Button mie='none' flexGrow={1} onClick={handleSubmit} disabled={!isDirty && customFieldsErrors.length > 0} primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default RoomEdit;
