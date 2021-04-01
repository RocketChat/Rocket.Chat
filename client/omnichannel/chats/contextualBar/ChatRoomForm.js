import React, { useState, useMemo } from 'react';
import { Field, TextInput, ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSubscription } from 'use-subscription';

import { useTranslation } from '../../../contexts/TranslationContext';
import VerticalBar from '../../../components/VerticalBar';
import { useForm } from '../../../hooks/useForm';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { FormSkeleton } from '../../directory/Skeleton';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { hasAtLeastOnePermission } from '../../../../app/authorization';
import CustomFieldsForm from '../../../components/CustomFieldsForm';
import { useMethod } from '../../../contexts/ServerContext';
import { formsSubscription } from '../../../views/omnichannel/additionalForms';

const initialValuesUser = {
	name: '',
	email: '',
	phone: '',
	livechatData: '',
};

const initialValuesRoom = {
	topic: '',
	tags: '',
	livechatData: '',
	priorityId: '',
};


const getInitialValuesUser = (visitor) => {
	if (!visitor) {
		return initialValuesUser;
	}

	const { name, fname } = visitor;

	return {
		name: (name || fname) ?? '',
	};
};

const getInitialValuesRoom = (room) => {
	if (!room) {
		return initialValuesRoom;
	}

	const { topic, tags, livechatData, priorityId } = room;

	return {
		topic: topic ?? '',
		tags: tags ?? [],
		livechatData: livechatData ?? '',
		priorityId: priorityId ?? '',
	};
};


export function RoomEditWithData({ id, reload, close }) {
	const t = useTranslation();

	const { value: roomData, phase: state, error } = useEndpointData(`rooms.info?roomId=${ id }`);

	if ([state].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton/>;
	}

	if (error || !roomData || !roomData.room) {
		return <Box mbs='x16'>{t('Room_not_found')}</Box>;
	}


	return <VisitorData room={roomData} reload={reload} close={close} />;
}

function VisitorData({ room, reload, close }) {
	const t = useTranslation();

	const { room: { v: { _id } } } = room;

	const { value: visitor, phase: stateVisitor, error: errorVisitor } = useEndpointData(`livechat/visitors.info?visitorId=${ _id }`);

	if ([stateVisitor].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton/>;
	}

	if (errorVisitor || !visitor || !visitor.visitor) {
		return <Box mbs='x16'>{t('Visitor_not_found')}</Box>;
	}

	const { visitor: visitorData } = visitor;
	const { room: roomData } = room;

	return <RoomEdit room={roomData} visitor={visitorData} reload={reload} close={close} />;
}


export function RoomEdit({ room, visitor, reload, close }) {
	const t = useTranslation();

	const { values, handlers, hasUnsavedChanges: hasUnsavedChangesContact } = useForm(getInitialValuesUser(visitor));
	const { values: valuesRoom, handlers: handlersRoom, hasUnsavedChanges: hasUnsavedChangesRoom } = useForm(getInitialValuesRoom(room));
	const canViewCustomFields = () => hasAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields']);

	const {
		handleName,
	} = handlers;
	const {
		name,
	} = values;

	const {
		handleTopic,
		handleTags,
		handlePriorityId,
	} = handlersRoom;
	const {
		topic,
		tags,
		priorityId,
	} = valuesRoom;

	const forms = useSubscription(formsSubscription);

	const {
		useCurrentChatTags = () => {},
		usePrioritiesSelect = () => {},
	} = forms;

	const Tags = useCurrentChatTags();
	const PrioritiesSelect = usePrioritiesSelect();


	const { values: valueCustom, handlers: handleValueCustom, hasUnsavedChanges: hasUnsavedChangesCustomFields } = useForm({
		livechatData: valuesRoom.livechatData,
	});

	const { handleLivechatData } = handleValueCustom;
	const { livechatData } = valueCustom;

	const [customFieldsError, setCustomFieldsError] = useState([]);

	const { value: allCustomFields, phase: stateCustomFields } = useEndpointData('livechat/custom-fields');
	const { value: prioritiesResult = {}, phase: statePriorities } = useEndpointData('livechat/priorities.list');

	const jsonConverterToValidFormat = (customFields) => {
		const jsonObj = {};
		// eslint-disable-next-line no-return-assign
		customFields.map(({ _id, label, visibility, options, scope, defaultValue, required }) =>
			(visibility === 'visible' & scope === 'room')
			&& (jsonObj[_id] = {
				label,
				type: options ? 'select' : 'text',
				required,
				defaultValue,
				options: options && options.split(',').map((item) => item.trim()),
			}));
		return jsonObj;
	};

	const jsonCustomField = useMemo(() => (allCustomFields
		&& allCustomFields.customFields
		? jsonConverterToValidFormat(allCustomFields.customFields) : {}), [allCustomFields]);


	const dispatchToastMessage = useToastMessageDispatch();

	const saveRoom = useMethod('livechat:saveInfo');

	const handleSave = useMutableCallback(async (e) => {
		e.preventDefault();
		const userData = {
			_id: visitor._id,
			name,
		};

		const roomData = {
			_id: room._id,
			topic,
			tags: Object.values(tags),
			livechatData,
			...priorityId && { priorityId },
		};

		try {
			saveRoom(userData, roomData);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			reload && reload();
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const formIsValid = (hasUnsavedChangesContact || hasUnsavedChangesRoom || hasUnsavedChangesCustomFields) && customFieldsError.length === 0;

	if ([stateCustomFields, statePriorities].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton/>;
	}

	const { priorities } = prioritiesResult;

	return <>
		<VerticalBar.ScrollableContent is='form'>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={name} onChange={handleName} />
				</Field.Row>
			</Field>
			{ canViewCustomFields() && allCustomFields
			&& <CustomFieldsForm jsonCustomFields={jsonCustomField} customFieldsData={livechatData}
				setCustomFieldsData={handleLivechatData} setCustomFieldsError={setCustomFieldsError} /> }
			<Field>
				<Field.Label>{t('Topic')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={topic} onChange={handleTopic} />
				</Field.Row>
			</Field>
			{Tags && (tags && Object.values(tags).length > 0) && <Field>
				<Field.Label mb='x4'>{t('Tags')}</Field.Label>
				<Field.Row>
					<Tags value={Object.values(tags)} handler={handleTags} />
				</Field.Row>
			</Field>}
			{PrioritiesSelect && (priorities && priorities.length > 0)
			&& <PrioritiesSelect value={priorityId} label={t('Priority')} options={priorities} handler={handlePriorityId} />}
		</VerticalBar.ScrollableContent>
		<VerticalBar.Footer>
			<ButtonGroup stretch>
				<Button flexGrow={1} onClick={close}>{t('Cancel')}</Button>
				<Button mie='none' flexGrow={1} onClick={handleSave} disabled={!formIsValid} primary>{t('Save')}</Button>
			</ButtonGroup>
		</VerticalBar.Footer>
	</>;
}
