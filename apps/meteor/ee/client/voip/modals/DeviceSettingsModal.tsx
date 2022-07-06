import { Modal, Field, Select, ButtonGroup, Button, SelectOption } from '@rocket.chat/fuselage';
import { useTranslation, useAvailableDevices, useToastMessageDispatch, useSetModal, useSelectedDevices } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';

import { useChangeAudioInputDevice, useChangeAudioOutputDevice } from '../../../../client/contexts/CallContext';

type FieldValues = {
	inputDevice: string;
	outputDevice: string;
};

const DeviceSettingsModal = (): ReactElement => {
	const setModal = useSetModal();
	const onCancel = (): void => setModal();
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const selectedAudioDevices = useSelectedDevices();

	const { handleSubmit, control } = useForm<FieldValues>({
		defaultValues: {
			inputDevice: selectedAudioDevices?.audioInput?.id || '',
			outputDevice: selectedAudioDevices?.audioOutput?.id || '',
		},
	});

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
			dispatchToastMessage({ type: 'error', message: String(error) });
		}
	};

	return (
		<Modal is='form' onSubmit={handleSubmit(onSubmit)}>
			<Modal.Header>
				<Modal.Title>{t('Device_settings')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				<Field>
					<Field.Label>{t('Microphone')}</Field.Label>
					<Field.Row w='full' display='flex' flexDirection='column' alignItems='stretch'>
						<Controller
							name='inputDevice'
							control={control}
							render={({ field }): ReactElement => <Select {...field} options={availableInputDevices || []} />}
						/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Speakers')}</Field.Label>
					<Field.Row w='full' display='flex' flexDirection='column' alignItems='stretch'>
						<Controller
							name='outputDevice'
							control={control}
							render={({ field }): ReactElement => <Select {...field} options={availableOutputDevices || []} />}
						/>
					</Field.Row>
				</Field>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup stretch w='full'>
					<Button onClick={(): void => setModal()}>{t('Cancel')}</Button>
					<Button primary onClick={handleSubmit(onSubmit)}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default DeviceSettingsModal;
