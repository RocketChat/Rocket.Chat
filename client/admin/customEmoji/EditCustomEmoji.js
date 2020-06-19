import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { Box, Button, ButtonGroup, Margins, TextInput, Field, Icon, Skeleton, Throbber, InputBox } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { Modal } from '../../components/basic/Modal';
import { useFileInput } from '../../hooks/useFileInput';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { useEndpointUpload } from '../../hooks/useEndpointUpload';
import { useEndpointAction } from '../../hooks/useEndpointAction';
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
			{t('Custom_Emoji_Delete_Warning')}
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
			{t('Custom_Emoji_Has_Been_Deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function EditCustomEmojiWithData({ _id, cache, onChange, ...props }) {
	const t = useTranslation();
	const query = useMemo(() => ({
		query: JSON.stringify({ _id }),
	// TODO: remove cache. Is necessary for data invalidation
	}), [_id, cache]);

	const { data = { emojis: {} }, state, error } = useEndpointDataExperimental('emoji-custom.list', query);

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

	if (error || !data || !data.emojis || data.emojis.update.length < 1) {
		return <Box fontScale='h1' pb='x20'>{t('Custom_User_Status_Error_Invalid_User_Status')}</Box>;
	}

	return <EditCustomEmoji data={data.emojis.update[0]} onChange={onChange} {...props}/>;
}

export function EditCustomEmoji({ close, onChange, data, ...props }) {
	const t = useTranslation();

	const { _id, name: previousName, aliases: previousAliases, extension: previousExtension } = data || {};
	const previousEmoji = data || {};

	const [name, setName] = useState(previousName);
	const [aliases, setAliases] = useState(previousAliases.join(', '));
	const [emojiFile, setEmojiFile] = useState();
	const [modal, setModal] = useState();
	const [newEmojiPreview, setNewEmojiPreview] = useState(`/emoji-custom/${ encodeURIComponent(previousName) }.${ previousExtension }`);

	useEffect(() => {
		setName(previousName || '');
		setAliases((previousAliases && previousAliases.join(', ')) || '');
	}, [previousName, previousAliases, previousEmoji, _id]);

	const setEmojiPreview = useCallback(async (file) => {
		setEmojiFile(file);
		setNewEmojiPreview(URL.createObjectURL(file));
	}, [setEmojiFile]);

	const hasUnsavedChanges = useMemo(() => previousName !== name || aliases !== previousAliases.join(', ') || !!emojiFile, [previousName, name, aliases, previousAliases, emojiFile]);

	const saveAction = useEndpointUpload('emoji-custom.update', {}, t('Custom_Emoji_Updated_Successfully'));

	const handleSave = useCallback(async () => {
		const formData = new FormData();
		formData.append('emoji', emojiFile);
		formData.append('_id', _id);
		formData.append('name', name);
		formData.append('aliases', aliases);
		const result = await saveAction(formData);
		if (result.success) {
			onChange();
		}
	}, [emojiFile, _id, name, aliases, saveAction, onChange]);

	const deleteAction = useEndpointAction('POST', 'emoji-custom.delete', useMemo(() => ({ emojiId: _id }), [_id]));

	const onDeleteConfirm = useCallback(async () => {
		const result = await deleteAction();
		if (result.success) {
			setModal(() => <SuccessModal onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		}
	}, [close, deleteAction, onChange]);

	const openConfirmDelete = useCallback(() => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm} onCancel={() => setModal(undefined)}/>), [onDeleteConfirm, setModal]);

	const handleAliasesChange = useCallback((e) => setAliases(e.currentTarget.value), [setAliases]);

	const clickUpload = useFileInput(setEmojiPreview, 'emoji');

	return <>
		<VerticalBar.ScrollableContent {...props}>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Name')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Aliases')}</Field.Label>
				<Field.Row>
					<TextInput value={aliases} onChange={handleAliasesChange} placeholder={t('Aliases')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label alignSelf='stretch' display='flex' justifyContent='space-between' alignItems='center'>
					{t('Custom_Emoji')}
					<Button square onClick={clickUpload}><Icon name='upload' size='x20'/></Button>
				</Field.Label>
				{ newEmojiPreview && <Box display='flex' flexDirection='row' mbs='none' justifyContent='center'>
					<Margins inline='x4'>
						<Box is='img' style={{ objectFit: 'contain' }} w='x120' h='x120' src={newEmojiPreview}/>
					</Margins>
				</Box> }
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
		</VerticalBar.ScrollableContent>
		{ modal }
	</>;
}
