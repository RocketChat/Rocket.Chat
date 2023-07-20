import type { ILivechatVisitor, IOmnichannelRoom, Serialized } from '@rocket.chat/core-typings';
import { Field, TextInput, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { CustomFieldsForm } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import { useController, useForm } from 'react-hook-form';

import { hasAtLeastOnePermission } from '../../../../../../../app/authorization/client';
import { useOmnichannelPriorities } from '../../../../../../../ee/client/omnichannel/hooks/useOmnichannelPriorities';
import { ContextualbarFooter, ContextualbarScrollableContent } from '../../../../../../components/Contextualbar';
import Tags from '../../../../../../components/Omnichannel/Tags';
import { useFormsSubscription } from '../../../../additionalForms';
import { FormSkeleton } from '../../../components/FormSkeleton';
import { useCustomFieldsMetadata } from '../../../hooks/useCustomFieldsMetadata';
import { useSlaPolicies } from '../../../hooks/useSlaPolicies';

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

const getInitialValuesRoom = (room: Serialized<IOmnichannelRoom>) => {
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

	const { data: slaPolicies, isInitialLoading: isSlaPoliciesLoading } = useSlaPolicies();
	const { data: customFieldsMetadata, isInitialLoading: isCustomFieldsLoading } = useCustomFieldsMetadata({
		scope: 'room',
		enabled: canViewCustomFields,
	});
	const { data: priorities, isLoading: isPrioritiesLoading } = useOmnichannelPriorities();

	const { useSlaPoliciesSelect = () => undefined, usePrioritiesSelect = () => undefined } = useFormsSubscription();
	const SlaPoliciesSelect = useSlaPoliciesSelect();
	const PrioritiesSelect = usePrioritiesSelect();

	const {
		register,
		control,
		formState: { isDirty: isFormDirty, isValid: isFormValid },
		handleSubmit,
	} = useForm({
		mode: 'onChange',
		defaultValues: getInitialValuesRoom(room),
	});

	const { field: tagsField } = useController({ control, name: 'tags' });
	const { field: slaIdField } = useController({ control, name: 'slaId' });
	const { field: priorityIdField } = useController({ control, name: 'priorityId' });

	const handleSave = useCallback(
		async (data) => {
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
				await queryClient.invalidateQueries(['/v1/rooms.info', room._id]);

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

	if (isCustomFieldsLoading || isSlaPoliciesLoading || isPrioritiesLoading) {
		return (
			<ContextualbarScrollableContent>
				<FormSkeleton />
			</ContextualbarScrollableContent>
		);
	}

	return (
		<>
			<ContextualbarScrollableContent is='form' onSubmit={handleSubmit(handleSave)}>
				{canViewCustomFields && customFieldsMetadata && (
					<CustomFieldsForm formName='livechatData' formControl={control} metadata={customFieldsMetadata} />
				)}

				<Field>
					<Field.Label>{t('Topic')}</Field.Label>
					<Field.Row>
						<TextInput {...register('topic')} flexGrow={1} />
					</Field.Row>
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

					<Button mie='none' flexGrow={1} onClick={handleSubmit(handleSave)} disabled={!isFormValid || !isFormDirty} primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
}

export default RoomEdit;
