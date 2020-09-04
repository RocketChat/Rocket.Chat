import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { Box, Button, ButtonGroup, Margins, TextInput, Field, Icon, Skeleton, Throbber, InputBox, Modal } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useFileInput } from '../../hooks/useFileInput';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { validate, createSoundData } from './lib';
import { useSetModal } from '../../contexts/ModalContext';
import VerticalBar from '../../components/basic/VerticalBar';

const DeleteWarningModal = ({ onDelete, onCancel, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Custom_Sound_Delete_Warning')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={onDelete}>{t('Delete')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

const SuccessModal = ({ onClose, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='success' name='checkmark-circled' size={20}/>
			<Modal.Title>{t('Deleted')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Custom_Sound_Has_Been_Deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function EditCustomSound({ _id, cache, ...props }) {
	const query = useMemo(() => ({
		query: JSON.stringify({ _id }),
	}), [_id]);

	const { data, state, error } = useEndpointDataExperimental('custom-sounds.list', query);

	if (state === ENDPOINT_STATES.LOADING) {
		return <Box pb='x20'>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<ButtonGroup stretch w='full' mbs='x8'>
				<Button disabled><Throbber inheritColor/></Button>
				<Button primary disabled><Throbber inheritColor/></Button>
			</ButtonGroup>
			<ButtonGroup stretch w='full' mbs='x8'>
				<Button primary danger disabled><Throbber inheritColor/></Button>
			</ButtonGroup>
		</Box>;
	}

	if (error || !data || data.sounds.length < 1) {
		return <Box fontScale='h1' pb='x20'>{error}</Box>;
	}

	return <EditSound data={data.sounds[0]} {...props}/>;
}

function EditSound({ close, onChange, data, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { _id, name: previousName } = data || {};
	const previousSound = data || {};

	const [name, setName] = useState('');
	const [sound, setSound] = useState();
	const setModal = useSetModal();

	useEffect(() => {
		setName(previousName || '');
		setSound(previousSound || '');
	}, [previousName, previousSound, _id]);

	const deleteCustomSound = useMethod('deleteCustomSound');
	const uploadCustomSound = useMethod('uploadCustomSound');
	const insertOrUpdateSound = useMethod('insertOrUpdateSound');

	const handleChangeFile = useCallback((soundFile) => {
		setSound(soundFile);
	}, []);

	const hasUnsavedChanges = useMemo(() => previousName !== name || previousSound !== sound, [name, previousName, previousSound, sound]);

	const saveAction = useCallback(async (sound) => {
		const soundData = createSoundData(sound, name, { previousName, previousSound, _id });
		const validation = validate(soundData, sound);
		if (validation.length === 0) {
			let soundId;
			try {
				soundId = await insertOrUpdateSound(soundData);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}

			soundData._id = soundId;
			soundData.random = Math.round(Math.random() * 1000);

			if (sound && sound !== previousSound) {
				dispatchToastMessage({ type: 'success', message: t('Uploading_file') });

				const reader = new FileReader();
				reader.readAsBinaryString(sound);
				reader.onloadend = () => {
					try {
						uploadCustomSound(reader.result, sound.type, soundData);
						return dispatchToastMessage({ type: 'success', message: t('File_uploaded') });
					} catch (error) {
						dispatchToastMessage({ type: 'error', message: error });
					}
				};
			}
		}

		validation.forEach((error) => dispatchToastMessage({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }));
	}, [_id, dispatchToastMessage, insertOrUpdateSound, name, previousName, previousSound, t, uploadCustomSound]);

	const handleSave = useCallback(async () => {
		saveAction(sound);
		onChange();
	}, [saveAction, sound, onChange]);

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deleteCustomSound(_id);
			setModal(() => <SuccessModal onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [_id, close, deleteCustomSound, dispatchToastMessage, onChange]);

	const openConfirmDelete = () => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm} onCancel={() => setModal(undefined)}/>);

	const [clickUpload] = useFileInput(handleChangeFile, 'audio/mp3');

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Name')} />
			</Field.Row>
		</Field>

		<Field>
			<Field.Label alignSelf='stretch'>{t('Sound_File_mp3')}</Field.Label>
			<Box display='flex' flexDirection='row' mbs='none'>
				<Margins inline='x4'>
					<Button square onClick={clickUpload}><Icon name='upload' size='x20'/></Button>
					{(sound && sound.name) || 'none'}
				</Margins>
			</Box>
		</Field>

		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button primary danger onClick={openConfirmDelete}><Icon name='trash' mie='x4'/>{t('Delete')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}
