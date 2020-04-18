import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { Box, Headline, Button, Margins, TextInput, Skeleton, Field, ToggleSwitch, Divider } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';
import { roomTypes } from '../../../../../utils/client';
import { useEndpoint } from '../../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../../client/contexts/ToastMessagesContext';

export const useEndpointAction = (httpMethod, endpoint, params = {}, successMessage) => {
	const sendData = useEndpoint(httpMethod, endpoint);
	const dispatchToastMessage = useToastMessageDispatch();

	return useCallback(async () => {
		try {
			const data = await sendData(params);

			if (!data.success) {
				throw new Error(data.status);
			}

			dispatchToastMessage({ type: 'success', message: successMessage });

			return data;
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			return { success: false };
		}
	}, [JSON.stringify(params)]);
};

export function EditRoom({ roomId }) {
	const t = useTranslation();
	const [shouldUpdate, setShouldUpdate] = useState({});
	const [newData, setNewData] = useState({});
	const [changeArchivation, setChangeArchivation] = useState(false);

	useEffect(() => {
		if (shouldUpdate) {
			setNewData({});
		}
	}, [shouldUpdate]);

	const hasUnsavedChanges = useMemo(() => Object.values(newData).filter((current) => current === null).length < Object.keys(newData).length, [JSON.stringify(newData)]);

	const query = useMemo(() => ({
		roomId,
	}), [roomId, shouldUpdate]);

	const endpointData = useEndpointData('GET', 'rooms.info', query) || {};
	const data = endpointData?.room || {};

	const saveQuery = useMemo(() => ({ rid: roomId, ...Object.fromEntries(Object.entries(newData).filter(([, value]) => value !== null)) }), [roomId, JSON.stringify(newData)]);

	const archiveSelector = data.archived ? 'unarchive' : 'archive';
	const archiveMessage = archiveSelector === 'archive' ? 'Room_has_been_archived' : 'Room_has_been_archived';
	const archiveQuery = useMemo(() => ({ rid: roomId, action: data.archived ? 'unarchive' : 'archive' }), [roomId, changeArchivation]);

	const saveAction = useEndpointAction('POST', 'rooms.saveRoomSettings', saveQuery, t('Room_updated_successfully'));
	const archiveAction = useEndpointAction('POST', 'rooms.changeArchivationState', archiveQuery, t(archiveMessage));

	const updateType = (type) => () => (type === 'p' ? 'c' : 'p');
	const areEqual = (a, b) => a === b || !(a || b);

	const handleChange = (field, currentValue, getValue = (e) => e.currentTarget.value) => (e) => setNewData({ ...newData, [field]: areEqual(getValue(e), currentValue) ? null : getValue(e) });
	const handleSave = async () => {
		if (hasUnsavedChanges) {
			setShouldUpdate(await saveAction());
		}
		if (changeArchivation) {
			setShouldUpdate(await archiveAction());
		}
	};

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

	const roomName = data.t === 'd' ? data.usernames.join(' x ') : roomTypes.getRoomName(data.t, { type: data.t, ...data });
	const roomType = newData.roomType ?? data.t;
	const readOnly = newData.readOnly ?? !!data.ro;
	const isArchived = changeArchivation ? !data.archived : !!data.archived;
	const isDefault = newData.default ?? !!data.default;

	return <Box w='full' h='full' pb='x24'>
		<Margins blockEnd='x12'>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput value={newData.roomName ?? roomName} onChange={handleChange('roomName', roomName)} flexGrow={1}/>
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
					<TextInput value={(newData.roomTopic ?? data.topic) || ''} onChange={handleChange('roomTopic', data.topic)} flexGrow={1}/>
				</Field.Row>
			</Field>
			<Field mbs='x20'>
				<Field.Row>
					<Box display='flex' flexDirection='row' alignItems='flex-start'>
						<Box display='flex' flexDirection='column' alignItems='flex-end' flexGrow='1' textColor={roomType !== 'c' ? 'hint' : 'default'}>
							<Box textStyle='s1'>{t('Public')}</Box>
							<Box textStyle='p1' style={{ textAlign: 'end' }}>{t('All_users_in_the_channel_can_write_new_messages')}</Box>
						</Box>
						<Margins inline='x16'>
							<ToggleSwitch checked={roomType === 'p'} onChange={handleChange('roomType', data.t, updateType(roomType))}/>
						</Margins>
						<Box display='flex' flexDirection='column' alignItems='flex-start' flexGrow='1' textColor={roomType !== 'p' ? 'hint' : 'default'}>
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
						<ToggleSwitch checked={isArchived} onChange={() => setChangeArchivation(!changeArchivation)}/>
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
							<Button flexGrow={1} >{t('Cancel')}</Button>
							<Button flexGrow={1} disabled={!hasUnsavedChanges && !changeArchivation} onClick={() => setNewData({})}>{t('Reset')}</Button>
							<Button mie='none' flexGrow={1} disabled={!hasUnsavedChanges && !changeArchivation} onClick={handleSave}>{t('Save')}</Button>
						</Margins>
					</Box>
				</Field.Row>
			</Field>
		</Margins>
	</Box>;
}
