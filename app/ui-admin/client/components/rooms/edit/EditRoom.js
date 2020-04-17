import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { Box, Headline, Button, ButtonGroup, Icon, Margins, TextInput, Skeleton, Field, ToggleSwitch, Divider } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';
import { roomTypes } from '../../../../../utils/client';
import { roomTypeI18nMap } from '../AdminRooms';


// const SettingValue = ({ value, onClickEdit }) => <Box display='flex' flexDirection='row' alignItems='center' mbs='x4'>
// 	<Box textStyle='p1'>{value}</Box>
// 	{typeof onClickEdit === 'function' && <Box p='x2' mis='x8' style={{ cursor: 'pointer' }} onClick={onClickEdit} ><Icon name='edit' size='x16'></Icon></Box>}
// </Box>;

export function EditRoom({ roomId }) {
	const t = useTranslation();
	// const [name, setName] = useState('');
	const [newData, setNewData] = useState({});
	// const [topic, setTopic] = useState('');
	// const [type, setType] = useState('');
	// const [state, setState] = useState('');
	// const [readOnly, setReadOnly] = useState('');
	// const [isDefault, setIsDefault] = useState('');
	// const [featured, setFeatured] = useState('');

	const hasUnsavedChanges = useMemo(() => Object.values(newData).filter((current) => current === null).length < Object.keys(newData).length, [JSON.stringify(newData)]);

	const query = useMemo(() => ({
		roomId,
	}), [roomId]);

	const endpointData = useEndpointData('GET', 'rooms.info', query) || {};

	const data = endpointData?.room || {};

	// let roomName = '';
	// if (endpointData.length > 0) {
	// 	roomName = data.t === 'd' ? data.usernames.join(' x ') : roomTypes.getRoomName(data.t, { type: data.t, ...data });
	// }

	// useEffect(() => {
	// 	console.log(roomName);
	// 	console.log(endpointData);
	// 	setName(roomName);
	// 	setTopic(data.topic);
	// 	setType(data.t);
	// 	setState(data.archived);
	// 	setReadOnly(data.ro);
	// 	setIsDefault(data.default);
	// 	setFeatured(data.featured);
	// }, [Object.keys(endpointData).length === 0]);

	// const clickEdit = useCallback((fieldName, value) => () => setCurrentField({ value, newValue: value, fieldName }), []);
	// const handleSave = useCallback(() => setCurrentField({ currentField: '' }), []);
	// const handleCancel = useCallback(() => setCurrentField({ currentField: '' }), []);

	// const isEditing = (fieldName) => fieldName === currentField.fieldName;

	// const handleChange = useCallback((field, currentValue, getValue = (e) => { e.currentTarget.value; }) => (e) => { console.log(getValue(e)); setNewData({ ...newData, [field]: getValue(e) === currentValue ? null : getValue(e) }); }, []);
	const updateType = (type) => () => (type === 'p' ? 'c' : 'p');
	const areEqual = (a, b) => a === b || !(a || b);
	const handleChange = (field, currentValue, getValue = (e) => e.currentTarget.value) => (e) => setNewData({ ...newData, [field]: areEqual(getValue(e), currentValue) ? null : getValue(e) });

	console.log(
		{
			newData,
			hasUnsavedChanges,
			endpointData,
		},
	);

	if (Object.keys(endpointData).length === 0) {
		return <Box w='full' pb='x24'>
			<Headline.Skeleton mbe='x4'/>
			<Skeleton mbe='x8' />
			<Headline.Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Headline.Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	// const hasUnsavedChanges = [
	// 	name !== roomName,
	// 	topic !== data.topic,
	// 	type !== data.t,
	// 	state !== data.archived,
	// 	readOnly !== data.ro,
	// 	isDefault !== data.default,
	// 	featured !== data.featured,
	// ].filter(Boolean).length > 0;

	// console.log(
	// 	{
	// 		state: {
	// 			name,
	// 			topic,
	// 			type,
	// 			state,
	// 			readOnly,
	// 			isDefault,
	// 			featured,
	// 		},
	// 		hasUnsavedChanges,
	// 	},
	// );

	const roomName = data.t === 'd' ? data.usernames.join(' x ') : roomTypes.getRoomName(data.t, { type: data.t, ...data });

	const type = newData.type ?? data.t;
	const readOnly = newData.readOnly ?? data.ro;
	const archived = newData.archived ?? data.archived ?? false;
	const isDefault = newData.default ?? data.default;

	console.log(type);


	return <Box w='full' h='full' pb='x24'>
		<Margins blockEnd='x12'>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput value={newData.name ?? roomName} onChange={handleChange('name', roomName)} flexGrow={1}/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Owner')}</Field.Label>
				<Field.Row>
					<Box textStyle='p1'>{data.u?.username}</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Topic')}</Field.Label>
				<Field.Row>
					<TextInput value={(newData.topic ?? data.topic) || ''} onChange={handleChange('topic', data.topic)} flexGrow={1}/>
				</Field.Row>
			</Field>
			<Field mbs='x20'>
				<Field.Row>
					<Box display='flex' flexDirection='row' alignItems='flex-start'>
						<Box display='flex' flexDirection='column' alignItems='flex-end' flexGrow='1' textColor={type !== 'c' ? 'hint' : 'default'}>
							<Box textStyle='s1'>{t('Public')}</Box>
							<Box textStyle='p1' style={{ textAlign: 'end' }}>{t('All_users_in_the_channel_can_write_new_messages')}</Box>
						</Box>
						<Margins inline='x16'>
							<ToggleSwitch checked={type === 'p'} onChange={handleChange('type', data.t, updateType(type))}/>
						</Margins>
						<Box display='flex' flexDirection='column' alignItems='flex-start' flexGrow='1' textColor={type !== 'p' ? 'hint' : 'default'}>
							<Box textStyle='s1'>{t('Private')}</Box>
							<Box textStyle='p1' style={{ textAlign: 'start' }}>{t('Just_invited_people_can_access_this_channel')}</Box>
						</Box>
					</Box>
				</Field.Row>
				<Divider />
			</Field>
			<Field mbs='x20'>
				<Field.Row>
					<Box display='flex' flexDirection='row' alignItems='flex-start'>
						<Box display='flex' flexDirection='column' alignItems='flex-end' flexGrow='1' textColor={readOnly ? 'hint' : 'default'}>
							<Box textStyle='s1'>{t('Collaborative')}</Box>
							<Box textStyle='p1' style={{ textAlign: 'end' }}>{t('All_users_in_the_channel_can_write_new_messages')}</Box>
						</Box>
						<Margins inline='x16'>
							<ToggleSwitch checked={readOnly} onChange={handleChange('readOnly', data.ro, () => !readOnly)}/>
						</Margins>
						<Box display='flex' flexDirection='column' alignItems='flex-start' flexGrow='1' textColor={!readOnly ? 'hint' : 'default'}>
							<Box textStyle='s1'>{t('Read_only')}</Box>
							<Box textStyle='p1' style={{ textAlign: 'start' }}>{t('Only_authorized_users_can_write_new_messages')}</Box>
						</Box>
					</Box>
				</Field.Row>
				<Divider />
			</Field>
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<Field.Label>{t('Archived')}</Field.Label>
						<ToggleSwitch checked={archived} onChange={handleChange('archived', data.archived, () => !archived)}/>
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<Field.Label>{t('Default')}</Field.Label>
						<ToggleSwitch checked={isDefault} onChange={handleChange('default', data.default, () => !isDefault)}/>
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
						<Margins inlineEnd='x4'>
							<Button flexGrow={1}>{t('Cancel')}</Button>
							<Button flexGrow={1}>{t('Reset')}</Button>
							<Button mie='none' flexGrow={1}>{t('Save')}</Button>
						</Margins>
					</Box>
				</Field.Row>
			</Field>

			{/* <Box display='flex' flexDirection='column'>
				<Box textStyle='s2'>{t('Name')}</Box>
				{(!isEditing('name') && <SettingValue value={roomName || ''} onClickEdit={data.t !== 'd' ? clickEdit('name', roomName || '') : undefined}/>)
				|| <Box display='flex' flexDirection='row' alignItems='center' mbs='x4'>
					<TextInput value={currentField.newValue} onChange={handleChange} flexGrow={1}/>
					<ButtonGroup>
						<Button primary onClick={handleSave} m='none'>{t('Save')}</Button>
						<Button onClick={handleCancel} m='none'>{t('Cancel')}</Button>
					</ButtonGroup>
				</Box>}
			</Box>
			{
				data.t !== 'd' && <><Box display='flex' flexDirection='column'>
					<Box textStyle='s2'>{t('Owner')}</Box>
					<SettingValue value={data?.u?.username || ''}/>
				</Box>
				<Box display='flex' flexDirection='column' >
					<Box textStyle='s2'>{t('Topic')}</Box>
					<SettingValue value={data.topic} onClickEdit={clickEdit('topic', data.topic)}/>
				</Box></>
			}
			<Box display='flex' flexDirection='column'>
				<Box textStyle='s2'>{t('Type')}</Box>
				<SettingValue value={t(roomTypeI18nMap[data.t])} onClickEdit={data.t !== 'd' && clickEdit('type', data.t)}/>
			</Box>
			<Box display='flex' flexDirection='column'>
				<Box textStyle='s2'>{t('State')}</Box>
				<SettingValue value={data.archived ? t('Archived') : t('Active')} onClickEdit={clickEdit('state', data.archived)}/>
			</Box>
			<Box display='flex' flexDirection='column'>
				<Box textStyle='s2'>{t('Read_only_channel')}</Box>
				<SettingValue value={data.ro ? t('True') : t('False')} onClickEdit={clickEdit('readOnly', data.ro)}/>
			</Box>
			<Box display='flex' flexDirection='column'>
				<Box textStyle='s2'>{t('Default')}</Box>
				<SettingValue value={data.default ? t('True') : t('False')} onClickEdit={clickEdit('default', data.default)}/>
			</Box>
			<Box display='flex' flexDirection='column'>
				<Box textStyle='s2'>{t('Featured')}</Box>
				<SettingValue value={data.featured ? t('True') : t('False')} onClickEdit={clickEdit('readOnly', data.featured)}/>
			</Box> */}
		</Margins>
	</Box>;
}
