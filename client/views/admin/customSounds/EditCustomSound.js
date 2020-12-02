import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { Box, Button, ButtonGroup, Margins, TextInput, Field, Icon, Skeleton, Throbber, InputBox } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useFileInput } from '../../../hooks/useFileInput';
import { validate, createSoundData } from './lib';
import { useSetModal } from '../../../contexts/ModalContext';
import VerticalBar from '../../../components/VerticalBar';
import DeleteSuccessModal from '../../../components/DeleteSuccessModal';
import DeleteWarningModal from '../../../components/DeleteWarningModal';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';

function EditCustomSound({ _id, onChange, ...props }) {
	const query = useMemo(() => ({ query: JSON.stringify({ _id }) }), [_id]);

	const { value: data, phase: state, error, reload } = useEndpointData('custom-sounds.list', query);

	if (state === AsyncStatePhase.LOADING) {
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

	const handleChange = () => {
		onChange && onChange();
		reload && reload();
	};

	return <EditSound data={data.sounds[0]} onChange={handleChange} {...props}/>;
}

function EditSound({ close, onChange, data, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const { _id, name: previousName } = data || {};
	const previousSound = useMemo(() => data || {}, [data]);

	const [name, setName] = useState(() => data?.name ?? '');
	const [sound, setSound] = useState(() => data ?? {});

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

	const handleDeleteButtonClick = useCallback(() => {
		const handleClose = () => {
			setModal(null);
			close();
			onChange();
		};

		const handleDelete = async () => {
			try {
				await deleteCustomSound(_id);
				setModal(() => <DeleteSuccessModal
					children={t('Custom_Sound_Has_Been_Deleted')}
					onClose={handleClose}
				/>);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
				onChange();
			}
		};

		const handleCancel = () => {
			setModal(null);
		};

		setModal(() => <DeleteWarningModal
			children={t('Custom_Sound_Delete_Warning')}
			onDelete={handleDelete}
			onCancel={handleCancel}
		/>);
	}, [_id, close, deleteCustomSound, dispatchToastMessage, onChange, setModal, t]);

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
					<Button primary danger onClick={handleDeleteButtonClick}>
						<Icon name='trash' mie='x4'/>{t('Delete')}
					</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}

export default EditCustomSound;
