import { Box, Button, ButtonGroup, Margins, TextInput, Field, FieldGroup, IconButton } from '@rocket.chat/fuselage';
import { useSetModal, useToastMessageDispatch, useAbsoluteUrl, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC, ChangeEvent } from 'react';
import React, { useCallback, useState, useMemo, useEffect } from 'react';

import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../components/Contextualbar';
import GenericModal from '../../../components/GenericModal';
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
	const [errors, setErrors] = useState({ name: false, aliases: false });

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
		setAliases(previousAliases?.join(', ') || '');
	}, [previousName, previousAliases, _id]);

	const hasUnsavedChanges = useMemo(
		() => previousName !== name || aliases !== previousAliases.join(', ') || !!emojiFile,
		[previousName, name, aliases, previousAliases, emojiFile],
	);

	const saveAction = useEndpointUpload('/v1/emoji-custom.update', t('Custom_Emoji_Updated_Successfully'));

	const handleSave = useCallback(async () => {
		if (!name) {
			return setErrors((prevState) => ({ ...prevState, name: true }));
		}

		if (name === aliases) {
			return setErrors((prevState) => ({ ...prevState, aliases: true }));
		}

		if (!emojiFile && !newEmojiPreview) {
			return;
		}

		const formData = new FormData();
		emojiFile && formData.append('emoji', emojiFile);
		formData.append('_id', _id);
		formData.append('name', name);
		formData.append('aliases', aliases);
		const result = (await saveAction(formData)) as { success: boolean };
		if (result.success) {
			onChange();
			close();
		}
	}, [emojiFile, _id, name, aliases, saveAction, onChange, close, newEmojiPreview]);

	const deleteAction = useEndpointAction('POST', '/v1/emoji-custom.delete');

	const handleDeleteButtonClick = useCallback(() => {
		const handleDelete = async (): Promise<void> => {
			try {
				await deleteAction({ emojiId: _id });
				dispatchToastMessage({ type: 'success', message: t('Custom_Emoji_Has_Been_Deleted') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				onChange();
				setModal(null);
				close();
			}
		};

		const handleCancel = (): void => {
			setModal(null);
		};

		setModal(() => (
			<GenericModal variant='danger' onConfirm={handleDelete} onCancel={handleCancel} onClose={handleCancel} confirmText={t('Delete')}>
				{t('Custom_Emoji_Delete_Warning')}
			</GenericModal>
		));
	}, [setModal, deleteAction, _id, dispatchToastMessage, t, onChange, close]);

	const handleChangeAliases = useCallback(
		(e) => {
			if (e.currentTarget.value !== name) {
				setErrors((prevState) => ({ ...prevState, aliases: false }));
			}

			return setAliases(e.currentTarget.value);
		},
		[setAliases, name],
	);

	const [clickUpload] = useFileInput(setEmojiFile, 'emoji');

	const handleChangeName = (e: ChangeEvent<HTMLInputElement>): void => {
		if (e.currentTarget.value !== '') {
			setErrors((prevState) => ({ ...prevState, name: false }));
		}

		return setName(e.currentTarget.value);
	};

	return (
		<>
			<ContextualbarScrollableContent {...props}>
				<FieldGroup>
					<Field>
						<Field.Label>{t('Name')}</Field.Label>
						<Field.Row>
							<TextInput value={name} onChange={handleChangeName} placeholder={t('Name')} />
						</Field.Row>
						{errors.name && <Field.Error>{t('error-the-field-is-required', { field: t('Name') })}</Field.Error>}
					</Field>
					<Field>
						<Field.Label>{t('Aliases')}</Field.Label>
						<Field.Row>
							<TextInput value={aliases} onChange={handleChangeAliases} placeholder={t('Aliases')} />
						</Field.Row>
						{errors.aliases && <Field.Error>{t('Custom_Emoji_Error_Same_Name_And_Alias')}</Field.Error>}
					</Field>
					<Field>
						<Field.Label alignSelf='stretch' display='flex' justifyContent='space-between' alignItems='center'>
							{t('Custom_Emoji')}
							<IconButton icon='upload' secondary onClick={clickUpload} />
						</Field.Label>
						{newEmojiPreview && (
							<Box display='flex' flexDirection='row' mbs='none' justifyContent='center'>
								<Margins inline={4}>
									<Box is='img' style={{ objectFit: 'contain' }} w='x120' h='x120' src={newEmojiPreview} />
								</Margins>
							</Box>
						)}
					</Field>
				</FieldGroup>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>
						{t('Save')}
					</Button>
				</ButtonGroup>
				<ButtonGroup mbs={8} stretch>
					<Button icon='trash' danger onClick={handleDeleteButtonClick}>
						{t('Delete')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default EditCustomEmoji;
