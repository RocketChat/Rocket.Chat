import { Box, Field, ToggleSwitch, Select, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useMemo } from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useUserRoom } from '../../../../contexts/UserContext';
import { useEndpointActionExperimental } from '../../../../hooks/useEndpointAction';
import { useForm } from '../../../../hooks/useForm';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';

const useInitialValues = (room) => {
	const { ephemeralTime } = room;
	return useMemo(
		() => ({
			ephemeralTime,
			updateRoomEphemeral: false,
			newEphemeralTime: '',
		}),
		[ephemeralTime],
	);
};
const EphemeralTimeModal = ({ rid, tabBar }) => {
	const handleClose = useMutableCallback(() => tabBar && tabBar.close());
	const t = useTranslation();
	const room = useUserRoom(rid);
	const formatDateAndTime = useFormatDateAndTime();
	const updateEphemeralRoom = useEndpointActionExperimental(
		'POST',
		'rooms.updateEphemeral',
		t('Room_updated_successfully'),
	);
	console.log(room);
	const { values, handlers, hasUnsavedChanges, reset, commit } = useForm(useInitialValues(room));
	const { ephemeralTime, updateRoomEphemeral, newEphemeralTime } = values;
	const { handleUpdateRoomEphemeral, handleNewEphemeralTime } = handlers;
	const timeOptions = [
		['1hr', t('1_hour')],
		['6hr', t('6_hours')],
		['12hr', t('12_hours')],
		['24hr', t('24_hours')],
	];
	const onSave = useCallback(async () => {
		const params = {
			rid,
			updateRoomEphemeral,
			newEphemeralTime,
		};
		await updateEphemeralRoom(params);
	}, [updateEphemeralRoom, updateRoomEphemeral, newEphemeralTime, rid]);
	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Text>{t('Ephemeral_time')}</VerticalBar.Text>
				{handleClose && <VerticalBar.Close onClick={handleClose} />}
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<Box pbe='x16'>
					<Box fontScale='p2' fontWeight='700' mb='x2'>
						Room Ephemeral Time
					</Box>
					<Box>{formatDateAndTime(ephemeralTime)}</Box>
				</Box>
				<Field pbe='x16'>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<Field.Label>{t('Update_Room_Ephemeral')}</Field.Label>
						<Field.Row>
							{/* <ToggleSwitch checked={hideSysMes} onChange={handleHideSysMes} /> */}
							<ToggleSwitch checked={updateRoomEphemeral} onChange={handleUpdateRoomEphemeral} />
						</Field.Row>
					</Box>
					<Field.Row>
						<Select
							maxWidth='100%'
							options={timeOptions}
							disabled={!updateRoomEphemeral}
							value={newEphemeralTime}
							onChange={handleNewEphemeralTime}
							placeholder={t('Select_an_option')}
							flexGrow={1}
						/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
							<ButtonGroup stretch flexGrow={1}>
								<Button type='reset'>{t('Reset')}</Button>
								<Button disabled={!hasUnsavedChanges} flexGrow={1} onClick={onSave}>
									{t('Save')}
								</Button>
							</ButtonGroup>
						</Box>
					</Field.Row>
				</Field>
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default EphemeralTimeModal;
