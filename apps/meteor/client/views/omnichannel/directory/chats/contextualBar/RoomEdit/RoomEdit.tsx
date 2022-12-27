import type { ILivechatVisitor, IOmnichannelGenericRoom, Serialized } from '@rocket.chat/core-typings';
import { Field, TextInput, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useController, useForm } from 'react-hook-form';

import { hasAtLeastOnePermission } from '../../../../../../../app/authorization/client';
import CustomFieldsForm from '../../../../../../components/CustomFieldsForm';
import Tags from '../../../../../../components/Omnichannel/Tags';
import VerticalBar from '../../../../../../components/VerticalBar';
import { useFormsSubscription } from '../../../../additionalForms';
import { FormSkeleton } from '../../../components/FormSkeleton';
import { useCustomFieldsMetadata } from '../../../hooks/useCustomFieldsMetadata';
import { usePrioritiesData } from '../../../hooks/usePrioritiesData';
import { useSlaPolicies } from '../../../hooks/useSlaPolicies';

type RoomEditProps = {
	room: Serialized<IOmnichannelGenericRoom>;
	visitor: Serialized<ILivechatVisitor>;
	reload?: () => void;
	reloadInfo?: () => void;
	onClose: () => void;
};

const ROOM_INTIAL_VALUE = {
	topic: '',
	tags: [],
	livechatData: {},
	slaId: '',
};

export const getInitialValuesRoom = (room: Serialized<IOmnichannelGenericRoom>) => {
	const { topic, tags, livechatData, slaId, priorityId } = room ?? ROOM_INTIAL_VALUE;

	return {
		topic: topic ?? '',
		tags: tags ?? [],
		livechatData: livechatData ?? {},
		slaId: slaId ?? '',
		priorityId: priorityId ?? '',
	};
};

function RoomEdit({ room, visitor, reload, reloadInfo, onClose }: RoomEditProps) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const canViewCustomFields = hasAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields']);

	const saveRoom = useEndpoint('POST', '/v1/livechat/room.saveInfo');

	const { data: slaPolicies, isLoading: isSlaPoliciesLoading } = useSlaPolicies();
	const { data: customFieldsMetadata, isLoading: isCustomFieldsLoading } = useCustomFieldsMetadata({
		scope: 'room',
		enabled: canViewCustomFields,
	});
	const { data: { priorities } = {}, isLoading: isPrioritiesLoading } = usePrioritiesData();

	const { useSlaPoliciesSelect = () => undefined, usePrioritiesSelect = () => undefined } = useFormsSubscription();
	const SlaPoliciesSelect = useSlaPoliciesSelect();
	const PrioritiesSelect = usePrioritiesSelect();

	const {
		register,
		getValues: getFormValues,
		control,
		formState: { isDirty: isFormDirty, isValid: isFormValid, errors },
		setError,
		handleSubmit,
		trigger,
	} = useForm({
		mode: 'onBlur',
		defaultValues: getInitialValuesRoom(room),
	});

	const { field: livechatDataField } = useController({ control, name: 'livechatData' });
	const { field: tagsField } = useController({ control, name: 'tags' });
	const { field: slaIdField } = useController({ control, name: 'slaId' });
	const { field: priorityIdField } = useController({ control, name: 'priorityId' });

	const handleSave = useMutableCallback(async (e) => {
		e.preventDefault();

		if (!isFormValid) {
			return;
		}

		const { topic, tags, livechatData, slaId, priorityId } = getFormValues();

		const guestData = {
			_id: visitor._id,
		};

		const roomData = {
			_id: room._id,
			topic,
			tags: tags.sort(),
			livechatData,
			slaId,
			priorityId,
		};

		try {
			await saveRoom({ guestData, roomData });
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			reload?.();
			reloadInfo?.();
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleCustomFieldsError = useMutableCallback((validator) => {
		const { livechatData } = errors;
		const formattedErrors = livechatData ? Object.keys(livechatData).map((name) => ({ name })) : [];
		const customFormErrors = validator(formattedErrors);

		if (!customFormErrors.length) {
			trigger('livechatData');
			return;
		}

		customFormErrors.forEach(({ name }: { name: string }) => {
			setError(`livechatData.${name}`, { type: 'custom' });
		});
	});

	if (isCustomFieldsLoading || isSlaPoliciesLoading || isPrioritiesLoading) {
		return (
			<VerticalBar.ScrollableContent>
				<FormSkeleton />
			</VerticalBar.ScrollableContent>
		);
	}

	return (
		<>
			<VerticalBar.ScrollableContent is='form' onSubmit={handleSubmit(handleSave)}>
				{canViewCustomFields && customFieldsMetadata && (
					<CustomFieldsForm
						jsonCustomFields={customFieldsMetadata}
						customFieldsData={livechatDataField.value}
						setCustomFieldsData={livechatDataField.onChange}
						setCustomFieldsError={handleCustomFieldsError}
					/>
				)}

				<Field>
					<Field.Label>{t('Topic')}</Field.Label>
					<Field.Row>
						<TextInput {...register('topic')} flexGrow={1} />
					</Field.Row>
				</Field>

				<Field>
					<Tags tags={tagsField.value} handler={tagsField.onChange} />
				</Field>

				{SlaPoliciesSelect && !!slaPolicies?.length && (
					<SlaPoliciesSelect label={t('SLA_Policy')} value={slaIdField.value} options={slaPolicies} onChange={slaIdField.onChange} />
				)}

				{PrioritiesSelect && !!priorities?.length && (
					<PrioritiesSelect label={t('Priority')} value={priorityIdField.value} options={priorities} onChange={priorityIdField.onChange} />
				)}
			</VerticalBar.ScrollableContent>

			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button flexGrow={1} onClick={onClose}>
						{t('Cancel')}
					</Button>

					<Button mie='none' flexGrow={1} onClick={handleSave} disabled={!isFormValid || !isFormDirty} primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
}

export default RoomEdit;
