import React, { useCallback, useState, useMemo, useEffect, FC, ChangeEvent } from 'react';
import { Box, Button, ButtonGroup, Margins, TextInput, Field, Icon } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useFileInput } from '../../hooks/useFileInput';
import { useEndpointUpload } from '../../hooks/useEndpointUpload';
import { useSetModal } from '../../contexts/ModalContext';
import { useEndpointAction } from '../../hooks/useEndpointAction';
import VerticalBar from '../../components/basic/VerticalBar';
import DeleteSuccessModal from '../../components/DeleteSuccessModal';
import DeleteWarningModal from '../../components/DeleteWarningModal';
import { EmojiDescriptor } from './types';


type EditCustomEmojiProps = {
	close: () => void;
	onChange: () => void;
	data: EmojiDescriptor;
};

const EditCustomEmoji: FC<EditCustomEmojiProps> = ({ close, onChange, data, ...props }) => {
	const t = useTranslation();

	const { _id, name: previousName, aliases: previousAliases, extension: previousExtension } = data || {};
	const previousEmoji = data || {};

	const [name, setName] = useState(previousName);
	const [aliases, setAliases] = useState(previousAliases.join(', '));
	const [emojiFile, setEmojiFile] = useState<Blob>();
	const setModal = useSetModal();
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
		if (!emojiFile) {
			return;
		}

		const formData = new FormData();
		formData.append('emoji', emojiFile);
		formData.append('_id', _id);
		formData.append('name', name);
		formData.append('aliases', aliases);
		const result = (await saveAction(formData)) as { success: boolean };
		if (result.success) {
			onChange();
		}
	}, [emojiFile, _id, name, aliases, saveAction, onChange]);

	const deleteAction = useEndpointAction('POST', 'emoji-custom.delete', useMemo(() => ({ emojiId: _id }), [_id]));

	const onDeleteConfirm = useCallback(async () => {
		const result = await deleteAction();
		if (result.success) {
			setModal(() => <DeleteSuccessModal
				children={t('Custom_Emoji_Has_Been_Deleted')}
				onClose={(): void => { setModal(undefined); close(); onChange(); }}
			/>);
		}
	}, [close, deleteAction, onChange, setModal, t]);

	const openConfirmDelete = useCallback(() => setModal(() => <DeleteWarningModal
		children={t('Custom_Emoji_Delete_Warning')}
		onDelete={onDeleteConfirm}
		onCancel={(): void => setModal(undefined)}
	/>), [onDeleteConfirm, setModal, t]);

	const handleAliasesChange = useCallback((e) => setAliases(e.currentTarget.value), [setAliases]);

	const [clickUpload] = useFileInput(setEmojiPreview, 'emoji');

	return <VerticalBar.ScrollableContent {...(props as any)}>
		<Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput value={name} onChange={(e: ChangeEvent<HTMLInputElement>): void => setName(e.currentTarget.value)} placeholder={t('Name')} />
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
	</VerticalBar.ScrollableContent>;
};

export default EditCustomEmoji;
