import { Box, Button, ButtonGroup, Margins, TextInput, Field, Icon } from '@rocket.chat/fuselage';
import React, { useCallback, useState, useMemo, useEffect, FC, ChangeEvent } from 'react';

import GenericModal from '../../../components/GenericModal';
import VerticalBar from '../../../components/VerticalBar';
import { useSetModal } from '../../../contexts/ModalContext';
import { useAbsoluteUrl } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useEndpointUpload } from '../../../hooks/useEndpointUpload';
import { useFileInput } from '../../../hooks/useFileInput';

type EditCustomEmojiProps = {
	close: () => void;
	onChange: () => void;
	data: {
		_id: string;
		name: string;
		aliases: string[];
		extension: string;
	};
};

const EditCustomEmoji: FC<EditCustomEmojiProps> = ({ close, onChange, data, ...props }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const absoluteUrl = useAbsoluteUrl();

	const { _id, name: previousName, aliases: previousAliases } = data || {};

	const [name, setName] = useState(() => data?.name ?? '');
	const [aliases, setAliases] = useState(() => data?.aliases?.join(', ') ?? '');
	const [emojiFile, setEmojiFile] = useState<Blob>();
	const newEmojiPreview = useMemo(() => {
		if (emojiFile) {
			return URL.createObjectURL(emojiFile);
		}

		if (data) {
			return absoluteUrl(`/emoji-custom/${encodeURIComponent(data.name)}.${data.extension}`);
		}

		return null;
	}, [absoluteUrl, data, emojiFile]);

	useEffect(() => {
		setName(previousName || '');
		setAliases((previousAliases && previousAliases.join(', ')) || '');
	}, [previousName, previousAliases, _id]);

	const hasUnsavedChanges = useMemo(
		() => previousName !== name || aliases !== previousAliases.join(', ') || !!emojiFile,
		[previousName, name, aliases, previousAliases, emojiFile],
	);

	const saveAction = useEndpointUpload(
		'emoji-custom.update',
		{},
		t('Custom_Emoji_Updated_Successfully'),
	);

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

	const deleteAction = useEndpointAction(
		'POST',
		'emoji-custom.delete',
		useMemo(() => ({ emojiId: _id }), [_id]),
	);

	const handleDeleteButtonClick = useCallback(() => {
		const handleClose = (): void => {
			setModal(null);
			close();
			onChange();
		};

		const handleDelete = async (): Promise<void> => {
			try {
				await deleteAction();
				setModal(() => (
					<GenericModal variant='success' onClose={handleClose} onConfirm={handleClose}>
						{t('Custom_Emoji_Has_Been_Deleted')}
					</GenericModal>
				));
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
				onChange();
			}
		};

		const handleCancel = (): void => {
			setModal(null);
		};

		setModal(() => (
			<GenericModal
				variant='danger'
				onConfirm={handleDelete}
				onCancel={handleCancel}
				onClose={handleCancel}
				confirmText={t('Delete')}
			>
				{t('Custom_Emoji_Delete_Warning')}
			</GenericModal>
		));
	}, [close, deleteAction, dispatchToastMessage, onChange, setModal, t]);

	const handleAliasesChange = useCallback((e) => setAliases(e.currentTarget.value), [setAliases]);

	const [clickUpload] = useFileInput(setEmojiFile, 'emoji');

	return (
		<VerticalBar.ScrollableContent {...(props as any)}>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput
						value={name}
						onChange={(e: ChangeEvent<HTMLInputElement>): void => setName(e.currentTarget.value)}
						placeholder={t('Name')}
					/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Aliases')}</Field.Label>
				<Field.Row>
					<TextInput value={aliases} onChange={handleAliasesChange} placeholder={t('Aliases')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label
					alignSelf='stretch'
					display='flex'
					justifyContent='space-between'
					alignItems='center'
				>
					{t('Custom_Emoji')}
					<Button square onClick={clickUpload}>
						<Icon name='upload' size='x20' />
					</Button>
				</Field.Label>
				{newEmojiPreview && (
					<Box display='flex' flexDirection='row' mbs='none' justifyContent='center'>
						<Margins inline='x4'>
							<Box
								is='img'
								style={{ objectFit: 'contain' }}
								w='x120'
								h='x120'
								src={newEmojiPreview}
							/>
						</Margins>
					</Box>
				)}
			</Field>
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button onClick={close}>{t('Cancel')}</Button>
						<Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>
							{t('Save')}
						</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button primary danger onClick={handleDeleteButtonClick}>
							<Icon name='trash' mie='x4' />
							{t('Delete')}
						</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
		</VerticalBar.ScrollableContent>
	);
};

export default EditCustomEmoji;
