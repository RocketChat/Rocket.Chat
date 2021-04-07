import React, { useState, useMemo } from 'react';
import { Field, TextInput, ButtonGroup, Button, Box, Tag, Icon } from '@rocket.chat/fuselage';
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
};

const initialValuesRoom = {
	topic: '',
	tags: '',
	livechatData: {},
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
		livechatData: livechatData ?? {},
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

const TagsManual = ({ tags = [], removeTag = () => {}, addTag = () => {} }) => {
	const [tagValue, handleTagValue] = useState('');

	const handleKeyDown = (event) => {
		if (event.key === 'Enter') {
			tagValue && addTag(tagValue);
			handleTagValue('');
		}
	};
	return <>
		<Field.Row>
			<TextInput onKeyDown={handleKeyDown} value={tagValue} flexGrow={1} onChange={(event) => handleTagValue(event.target.value)}/>
		</Field.Row>
		<Field.Row>
			{tags && <Box color='hint' display='flex' flex-direction='row'>
				{tags.length > 0 && tags.map((tag) => (
					<Box onClick={() => removeTag(tag)} key={tag} mie='x4'>
						<Tag style={{ display: 'inline', fontSize: '0.8rem' }} disabled>
							{tag}
							<Icon style={{ fontWeight: 'bold', paddingTop: '0.1rem', paddingBottom: '0.3rem' }} marginBlockStart='x2' name='cross' />
						</Tag>
					</Box>
				))}
			</Box>}
		</Field.Row>
	</>;
};


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
	const { value: tagsResult = [], phase: stateTags } = useEndpointData('livechat/tags.list');

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

	const { tags: tagsList } = tagsResult;

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

	if ([stateCustomFields, statePriorities, stateTags].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton/>;
	}

	const { priorities } = prioritiesResult;

	const removeTag = (tag) => {
		const tagsFiltered = tags.filter((tagArray) => tagArray !== tag);
		handleTags(tagsFiltered);
	};

	const addTag = (tag) => {
		handleTags([...tags, tag]);
	};

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
			{Tags && (tagsList && tagsList.length > 0) ? <Field>
				<Field.Label mb='x4'>{t('Tags')}</Field.Label>
				<Field.Row>
					<Tags value={Object.values(tags)} handler={handleTags} />
				</Field.Row>
			</Field> : <Field>
				<Field.Label mb='x4'>{t('Tags')}</Field.Label>
				<TagsManual tags={tags} removeTag={removeTag} addTag={addTag} />
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
