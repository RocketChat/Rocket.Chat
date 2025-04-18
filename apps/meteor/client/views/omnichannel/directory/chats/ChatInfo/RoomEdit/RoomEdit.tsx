import type { ILivechatVisitor, IOmnichannelRoom, Serialized } from '@rocket.chat/core-typings';
import { Field, FieldLabel, FieldRow, TextInput, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { CustomFieldsForm } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useId } from 'react';
import { useController, useForm } from 'react-hook-form';

import { hasAtLeastOnePermission } from '../../../../../../../app/authorization/client';
import { ContextualbarContent, ContextualbarFooter, ContextualbarScrollableContent } from '../../../../../../components/Contextualbar';
import Tags from '../../../../../../components/Omnichannel/Tags';
import { useOmnichannelPriorities } from '../../../../../../omnichannel/hooks/useOmnichannelPriorities';
import { SlaPoliciesSelect, PrioritiesSelect } from '../../../../additionalForms';
import { FormSkeleton } from '../../../components/FormSkeleton';
import { useCustomFieldsMetadata } from '../../../hooks/useCustomFieldsMetadata';
import { useSlaPolicies } from '../../../hooks/useSlaPolicies';

type RoomEditFormData = {
	topic: string;
	tags: string[];
	livechatData: any;
	slaId: string;
	priorityId: string;
};

type RoomEditProps = {
	room: Serialized<IOmnichannelRoom>;
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

const getInitialValuesRoom = (room: Serialized<IOmnichannelRoom>): RoomEditFormData => {
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
	const queryClient = useQueryClient();
	const canViewCustomFields = hasAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields']);

	const saveRoom = useEndpoint('POST', '/v1/livechat/room.saveInfo');

	const { data: slaPolicies, isLoading: isSlaPoliciesLoading } = useSlaPolicies();
	const { data: customFieldsMetadata, isLoading: isCustomFieldsLoading } = useCustomFieldsMetadata({
		scope: 'room',
		enabled: canViewCustomFields,
	});
	const { data: priorities, isLoading: isPrioritiesLoading } = useOmnichannelPriorities();

	const {
		register,
		control,
		formState: { isDirty: isFormDirty, isValid: isFormValid, isSubmitting },
		handleSubmit,
	} = useForm<RoomEditFormData>({
		mode: 'onChange',
		defaultValues: getInitialValuesRoom(room),
	});

	const { field: tagsField } = useController({ control, name: 'tags' });
	const { field: slaIdField } = useController({ control, name: 'slaId' });
	const { field: priorityIdField } = useController({ control, name: 'priorityId' });

	const handleSave = useCallback(
		async (data: RoomEditFormData) => {
			if (!isFormValid) {
				return;
			}

			const { topic, tags, livechatData, slaId, priorityId } = data;

			const guestData = {
				_id: visitor._id,
			};

			const roomData = {
				_id: room._id,
				topic,
				tags: tags.sort(),
				livechatData,
				priorityId,
				...(slaId && { slaId }),
			};

			try {
				await saveRoom({ guestData, roomData });
				await queryClient.invalidateQueries({
					queryKey: ['/v1/rooms.info', room._id],
				});

				dispatchToastMessage({ type: 'success', message: t('Saved') });
				reload?.();
				reloadInfo?.();
				onClose();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[dispatchToastMessage, isFormValid, onClose, queryClient, reload, reloadInfo, room._id, saveRoom, t, visitor._id],
	);

	const topicField = useId();

	// TODO: this loading should be checked in the `RoomEditWithData`
	// This component should not have logical data
	if (isCustomFieldsLoading || isSlaPoliciesLoading || isPrioritiesLoading) {
		return (
			<ContextualbarContent>
				<FormSkeleton />
			</ContextualbarContent>
		);
	}

	return (
		<>
			<ContextualbarScrollableContent is='form' onSubmit={handleSubmit(handleSave)}>
				{canViewCustomFields && customFieldsMetadata && (
					<CustomFieldsForm formName='livechatData' formControl={control} metadata={customFieldsMetadata} />
				)}

				<Field>
					<FieldLabel htmlFor={topicField}>{t('Topic')}</FieldLabel>
					<FieldRow>
						<TextInput {...register('topic')} id={topicField} flexGrow={1} />
					</FieldRow>
				</Field>

				<Field>
					<Tags tags={tagsField.value} handler={tagsField.onChange} department={room.departmentId} />
				</Field>

				{SlaPoliciesSelect && !!slaPolicies?.length && (
					<SlaPoliciesSelect label={t('SLA_Policy')} value={slaIdField.value} options={slaPolicies} onChange={slaIdField.onChange} />
				)}

				{PrioritiesSelect && !!priorities?.length && (
					<PrioritiesSelect label={t('Priority')} value={priorityIdField.value} options={priorities} onChange={priorityIdField.onChange} />
				)}
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button flexGrow={1} onClick={onClose}>
						{t('Cancel')}
					</Button>

					<Button
						mie='none'
						flexGrow={1}
						onClick={handleSubmit(handleSave)}
						loading={isSubmitting}
						disabled={!isFormValid || !isFormDirty}
						primary
					>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
}

export default RoomEdit;
