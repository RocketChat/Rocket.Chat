import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { Box, Button, ButtonGroup, Margins, TextInput, Field, Icon, Skeleton, Throbber, InputBox } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { Modal } from '../../../../client/components/basic/Modal';
import { useFileInput } from '../../../../client/hooks/useFileInput';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';

const DeleteWarningModal = ({ onDelete, onCancel, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Custom_User_Status_Delete_Warning')}
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
			{t('Custom_User_Status_Has_Been_Deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function EditSound({ _id, cache, ...props }) {
	const t = useTranslation();
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
		return <Box fontScale='h1' pb='x20'>{t('Custom_User_Status_Error_Invalid_User_Status')}</Box>;
	}

	return <EditCustomSound data={data.sounds[0]} {...props}/>;
}

export function EditCustomSound({ close, onChange, data, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { _id, name: previousName } = data || {};
	const previousSound = data || {};

	const [name, setName] = useState('');
	const [sound, setSound] = useState();
	const [modal, setModal] = useState();

	useEffect(() => {
		setName(previousName || '');
		setSound(previousSound || '');
	}, [previousName, previousSound, _id]);

	const deleteStatus = useMethod('deleteCustomUserStatus');

	const uploadCustomSound = useMethod('uploadCustomSound');
	// const deleteCustomSound = useMethod('deleteCustomSound');
	const insertOrUpdateSound = useMethod('insertOrUpdateSound');

	const getSoundData = (soundFile) => {
		const soundData = {};

		soundData._id = _id;
		soundData.previousName = previousName;
		soundData.extension = soundFile.name.split('.').pop();
		soundData.previousExtension = previousSound.extension;
		soundData.name = name;
		soundData.newFile = false;
		console.log(soundData);
		return soundData;
	};

	const handleChangeFile = (soundFile) => {
		setSound(soundFile);
	};

	const hasUnsavedChanges = useMemo(() => previousName !== name || previousSound !== sound, [name, sound]);

	const validate = (soundData, soundFile) => {
		const errors = [];

		if (!soundData._id) {
			errors.push('_id');
		}

		if (!soundData.name) {
			errors.push('Name');
		}

		errors.forEach((error) => dispatchToastMessage({ type: 'error', message: error }));
		debugger
		if (soundFile !== previousSound) {
			if (!/audio\/mp3/.test(soundFile.type) && !/audio\/mpeg/.test(soundFile.type) && !/audio\/x-mpeg/.test(soundFile.type)) {
				errors.push('FileType');
				dispatchToastMessage({ type: 'error', message: t('error-invalid-file-type') });
			}
		}

		return errors.length === 0;
	};

	const saveAction = async (sound) => {
		const soundData = getSoundData(sound);
		if (validate(soundData, sound)) {
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
				reader.readAsBinaryString(sound.soundFile);
				reader.onloadend = () => {
					console.log(reader.result, sound.soundFile.type, soundData);

					try {
						uploadCustomSound(reader.result, sound.soundFile.type, soundData);
						dispatchToastMessage({ type: 'success', message: t('File_uploaded') });
					} catch (error) {
						dispatchToastMessage({ type: 'error', message: error });
					}
				};
			}
		}
	};

	const handleSave = useCallback(async () => {
		saveAction(sound);
	}, [name, _id, sound]);

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deleteStatus(_id);
			setModal(() => <SuccessModal onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [_id]);

	const openConfirmDelete = () => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm} onCancel={() => setModal(undefined)}/>);


	const clickUpload = useFileInput(handleChangeFile, 'audio/mp3');


	return <>
		<Box display='flex' flexDirection='column' fontScale='p1' color='default' mbs='x20' {...props}>
			<Margins block='x4'>
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
			</Margins>
		</Box>
		{ modal }
	</>;
}


// import React, { useState } from 'react';
// import { Field, TextInput, Box, InputBox, Margins, Button } from '@rocket.chat/fuselage';
// import { useUniqueId } from '@rocket.chat/fuselage-hooks';
// import s from 'underscore.string';

// import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
// import { useTranslation } from '../../../../client/contexts/TranslationContext';
// import { useMethod } from '../../../../client/contexts/ServerContext';
// import Page from '../../../../client/components/basic/Page';

// export function EditSound({ roles, ...props }) {
// 	const t = useTranslation();

// 	const uploadCustomSound = useMethod('uploadCustomSound');
// 	const insertOrUpdateSound = useMethod('insertOrUpdateSound');

// 	const dispatchToastMessage = useToastMessageDispatch();

// 	const [newData, setNewData] = useState({});

// 	const fileSourceInputId = useUniqueId();

// 	const createSoundData = (name) => {
// 		const soundData = {};
// 		soundData.name = s.trim(name);
// 		soundData.newFile = true;
// 		return soundData;
// 	};

// 	const validate = (soundData, soundFile) => {
// 		const errors = [];
// 		if (!soundData.name) {
// 			errors.push('Name');
// 		}


// 		if (!soundFile) {
// 			errors.push('Sound_File_mp3');
// 		}

// 		errors.forEach((error) => dispatchToastMessage({ type: 'error', message: t('error-the-field-is-required', t(error)) }));

// 		if (soundFile) {
// 			if (!/audio\/mp3/.test(soundFile.type) && !/audio\/mpeg/.test(soundFile.type) && !/audio\/x-mpeg/.test(soundFile.type)) {
// 				errors.push('FileType');
// 				dispatchToastMessage({ type: 'error', message: t('error-invalid-file-type') });
// 			}
// 		}

// 		return errors.length === 0;
// 	};


// 	const saveAction = async (newData) => {
// 		const soundData = createSoundData(newData.name);
// 		if (validate(soundData, newData.soundFile)) {
// 			let soundId;
// 			try {
// 				soundId = await insertOrUpdateSound(soundData);
// 			} catch (error) {
// 				dispatchToastMessage({ type: 'error', message: error });
// 			}

// 			soundData._id = soundId;
// 			soundData.random = Math.round(Math.random() * 1000);

// 			if (soundId) {
// 				dispatchToastMessage({ type: 'success', message: t('Uploading_file') });

// 				const reader = new FileReader();
// 				reader.readAsBinaryString(newData.soundFile);
// 				reader.onloadend = () => {
// 					console.log(reader.result, newData.soundFile.type, soundData);

// 					try {
// 						uploadCustomSound(reader.result, newData.soundFile.type, soundData);
// 						dispatchToastMessage({ type: 'success', message: t('File_uploaded') });
// 					} catch (error) {
// 						dispatchToastMessage({ type: 'error', message: error });
// 					}
// 				};
// 			}
// 		}
// 	};

// 	const handleSave = async () => {
// 		if (Object.keys(newData).length) {
// 			await saveAction(newData);
// 			setNewData({});
// 		}
// 	};

// 	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => setNewData({ ...newData, [field]: getValue(e) });

// 	const handleChangeFile = (field, getFile = (e) => {
// 		let { files } = e.target;
// 		let soundFile;
// 		if (e.target.files == null || files.length === 0) {
// 			if (e.dataTransfer.files != null) {
// 				files = e.dataTransfer.files;
// 			} else {
// 				files = [];
// 			}
// 		}
// 		for (const file in files) {
// 			if (files.hasOwnProperty(file)) {
// 				soundFile = files[file];
// 			}
// 		}

// 		return soundFile;
// 	}) => (e) => {
// 		setNewData({ ...newData, [field]: getFile(e) });
// 	};

// 	const {
// 		name = '',
// 	} = newData;

// 	return <Page.ScrollableContent pi='x24' pb='x24' mi='neg-x24' is='form' { ...props }>
// 		<Margins blockEnd='x16'>
// 			<Field>
// 				<Field.Label>{t('Name')}</Field.Label>
// 				<Field.Row>
// 					<TextInput flexGrow={1} value={name} onChange={handleChange('name')}/>
// 				</Field.Row>
// 			</Field>

// 			<Field>
// 				<Field.Label alignSelf='stretch' htmlFor={fileSourceInputId}>{t('Sound_File_mp3')}</Field.Label>
// 				<Field.Row>
// 					<InputBox type='file' id={fileSourceInputId} onChange={handleChangeFile('soundFile')} />
// 				</Field.Row>
// 			</Field>

// 			<Field>
// 				<Field.Row>
// 					<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
// 						<Margins inlineEnd='x4'>
// 							<Button flexGrow={1} onClick={() => setNewData({})}>{t('Cancel')}</Button>
// 							<Button mie='none' flexGrow={1} onClick={handleSave}>{t('Save')}</Button>
// 						</Margins>
// 					</Box>
// 				</Field.Row>
// 			</Field>
// 		</Margins>
// 	</Page.ScrollableContent>;
// }
