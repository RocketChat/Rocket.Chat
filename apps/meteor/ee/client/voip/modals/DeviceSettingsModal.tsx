import type { SelectOption } from '@rocket.chat/fuselage';
import { Modal, Field, Select, Button, Box } from '@rocket.chat/fuselage';
import {
	useTranslation,
	useAvailableDevices,
	useToastMessageDispatch,
	useSetModal,
	useSelectedDevices,
	useIsDeviceManagementEnabled,
} from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';

import { useChangeAudioInputDevice, useChangeAudioOutputDevice } from '../../../../client/contexts/CallContext';
import { isSetSinkIdAvailable } from '../../../../client/providers/DeviceProvider/lib/isSetSinkIdAvailable';

type FieldValues = {
	inputDevice: string;
	outputDevice: string;
};

const DeviceSettingsModal = (): ReactElement => {
	const setModal = useSetModal();
	const onCancel = (): void => setModal();
	const isDeviceManagementEnabled = useIsDeviceManagementEnabled();
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const selectedAudioDevices = useSelectedDevices();

	const { handleSubmit, control } = useForm<FieldValues>({
		defaultValues: {
			inputDevice: selectedAudioDevices?.audioInput?.id || '',
			outputDevice: selectedAudioDevices?.audioOutput?.id || '',
		},
	});
	const [setSinkIdAvailable] = useState(() => isSetSinkIdAvailable());
	const availableDevices = useAvailableDevices();
	const changeAudioInputDevice = useChangeAudioInputDevice();
	const changeAudioOutputDevice = useChangeAudioOutputDevice();

	const availableInputDevices: SelectOption[] = availableDevices?.audioInput?.map((device) => [device.id, device.label]) || [];
	const availableOutputDevices: SelectOption[] = availableDevices?.audioOutput?.map((device) => [device.id, device.label]) || [];

	const onSubmit: SubmitHandler<FieldValues> = async (data) => {
		const selectedInputDevice = data.inputDevice && availableDevices?.audioInput?.find((device) => device.id === data.inputDevice);
		const selectedOutputDevice = data.outputDevice && availableDevices?.audioOutput?.find((device) => device.id === data.outputDevice);
		try {
			selectedInputDevice && changeAudioInputDevice(selectedInputDevice);
			selectedOutputDevice && changeAudioOutputDevice(selectedOutputDevice);
			setModal();
			dispatchToastMessage({ type: 'success', message: t('Devices_Set') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<Modal is='form' onSubmit={handleSubmit(onSubmit)}>
			<Modal.Header>
				<Modal.Title>{t('Device_settings')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				{!setSinkIdAvailable && (
					<Box color='danger-600' display='flex' flexDirection='column'>
						{t('Device_Changes_Not_Available')}
						<Box is='a' href='https://rocket.chat/download' target='_blank' rel='noopener noreferrer'>
							{t('Download_Destkop_App')}
						</Box>
					</Box>
				)}
				{!isDeviceManagementEnabled && (
					<Box color='danger-600' display='flex' flexDirection='column'>
						{t('Device_Changes_Not_Available_Insecure_Context')}
					</Box>
				)}
				<Field>
					<Field.Label>{t('Microphone')}</Field.Label>
					<Field.Row w='full' display='flex' flexDirection='column' alignItems='stretch'>
						<Controller
							name='inputDevice'
							control={control}
							render={({ field }): ReactElement => (
								<Select disabled={!setSinkIdAvailable} {...field} options={availableInputDevices || []} />
							)}
						/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Speakers')}</Field.Label>
					<Field.Row w='full' display='flex' flexDirection='column' alignItems='stretch'>
						<Controller
							name='outputDevice'
							control={control}
							render={({ field }): ReactElement => (
								<Select disabled={!setSinkIdAvailable} {...field} options={availableOutputDevices || []} />
							)}
						/>
					</Field.Row>
				</Field>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={(): void => setModal()}>{t('Cancel')}</Button>
					<Button disabled={!setSinkIdAvailable} primary onClick={handleSubmit(onSubmit)}>
						{t('Save')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default DeviceSettingsModal;
