import { Field, TextInput, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { hasAtLeastOnePermission } from '../../../../../../app/authorization/client';
import CustomFieldsForm from '../../../../../components/CustomFieldsForm';
import Tags from '../../../../../components/Omnichannel/Tags';
import VerticalBar from '../../../../../components/VerticalBar';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { useForm } from '../../../../../hooks/useForm';
import { formsSubscription } from '../../../additionalForms';
import { FormSkeleton } from '../../Skeleton';

const initialValuesRoom = {
	topic: '',
	tags: [],
	livechatData: {},
	priorityId: '',
};

const getInitialValuesRoom = (room) => {
	if (!room) {
		return initialValuesRoom;
	}

	const { topic, tags, livechatData, priorityId } = room;

	return {
		topic: topic ?? '',
		tags: tags ?? [],
		livechatData: livechatData ?? {},
		priorityId: priorityId ?? '',
	};
};

function RoomEdit({ room, visitor, reload, reloadInfo, close }) {
	const t = useTranslation();

	const { values: valuesRoom, handlers: handlersRoom, hasUnsavedChanges: hasUnsavedChangesRoom } = useForm(getInitialValuesRoom(room));
	const canViewCustomFields = () => hasAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields']);

	const { handleTopic, handleTags, handlePriorityId } = handlersRoom;
	const { topic, tags, priorityId } = valuesRoom;

	const forms = useSubscription(formsSubscription);

	const { usePrioritiesSelect = () => {} } = forms;

	const PrioritiesSelect = usePrioritiesSelect();

	const {
		values: valueCustom,
		handlers: handleValueCustom,
		hasUnsavedChanges: hasUnsavedChangesCustomFields,
	} = useForm({
		livechatData: valuesRoom.livechatData,
	});

	const { handleLivechatData } = handleValueCustom;
	const { livechatData } = valueCustom;

	const [customFieldsError, setCustomFieldsError] = useState([]);

	const { value: allCustomFields, phase: stateCustomFields } = useEndpointData('livechat/custom-fields');
	const { value: prioritiesResult = {}, phase: statePriorities } = useEndpointData('livechat/priorities.list');

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

	const jsonCustomField = useMemo(
		() => (allCustomFields && allCustomFields.customFields ? jsonConverterToValidFormat(allCustomFields.customFields) : {}),
		[allCustomFields],
	);

	const dispatchToastMessage = useToastMessageDispatch();

	const saveRoom = useMethod('livechat:saveInfo');

	const handleSave = useMutableCallback(async (e) => {
		e.preventDefault();
		const userData = {
			_id: visitor._id,
		};

		const roomData = {
			_id: room._id,
			topic,
			tags: tags.sort(),
			livechatData,
			...(priorityId && { priorityId }),
		};

		try {
			saveRoom(userData, roomData);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			reload && reload();
			reloadInfo && reloadInfo();
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const formIsValid = (hasUnsavedChangesRoom || hasUnsavedChangesCustomFields) && customFieldsError.length === 0;

	if ([stateCustomFields, statePriorities].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	const { priorities } = prioritiesResult;

	return (
		<>
			<VerticalBar.ScrollableContent is='form'>
				{canViewCustomFields() && allCustomFields && (
					<CustomFieldsForm
						jsonCustomFields={jsonCustomField}
						customFieldsData={livechatData}
						setCustomFieldsData={handleLivechatData}
						setCustomFieldsError={setCustomFieldsError}
					/>
				)}
				<Field>
					<Field.Label>{t('Topic')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} value={topic} onChange={handleTopic} />
					</Field.Row>
				</Field>
				<Field>
					<Tags tags={tags} handler={handleTags} />
				</Field>
				{PrioritiesSelect && priorities && priorities.length > 0 && (
					<PrioritiesSelect value={priorityId} label={t('Priority')} options={priorities} handler={handlePriorityId} />
				)}
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button flexGrow={1} onClick={close}>
						{t('Cancel')}
					</Button>
					<Button mie='none' flexGrow={1} onClick={handleSave} disabled={!formIsValid} primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
}

export default RoomEdit;
