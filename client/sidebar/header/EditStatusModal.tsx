import { Field, TextInput, FieldGroup, Modal, Icon, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement, useState, ChangeEvent, useCallback } from 'react';

import { EmojiPicker } from '../../../app/emoji/client/index';
import { IUser } from '../../../definition/IUser';
import { USER_STATUS_TEXT_MAX_LENGTH } from '../../components/UserStatus';
import UserStatusMenu from '../../components/UserStatusMenu';
import { useMethod } from '../../contexts/ServerContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';

type EditStatusModalProps = {
	onClose: () => void;
	userStatus: IUser['status'];
	userStatusText: IUser['statusText'];
};

const EditStatusModal = ({ onClose, userStatus, userStatusText }: EditStatusModalProps): ReactElement => {
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange');
	const setUserStatus = useMethod('setUserStatus');
	const dispatchToastMessage = useToastMessageDispatch();

	const t = useTranslation();
	const [statusText, setStatusText] = useState(userStatusText);
	const [statusType, setStatusType] = useState(userStatus);
	const [statusTextError, setStatusTextError] = useState<string | undefined>();

	const handleStatusText = useMutableCallback((e: ChangeEvent<HTMLInputElement>): void => {
		setStatusText(e.currentTarget.value);

		if (statusText && statusText.length > USER_STATUS_TEXT_MAX_LENGTH) {
			return setStatusTextError(t('Max_length_is', USER_STATUS_TEXT_MAX_LENGTH));
		}

		return setStatusTextError(undefined);
	});

	const handleStatusType = (type: IUser['status']): void => setStatusType(type);
	const handleSaveStatus = useCallback(async () => {
		try {
			await setUserStatus(statusType, statusText);
			dispatchToastMessage({ type: 'success', message: t('StatusMessage_Changed_Successfully') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}

		onClose();
	}, [dispatchToastMessage, statusType, statusText, setUserStatus, onClose, t]);

	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	const handleEmojiPicker = (event: any) => {
		const className = document.getElementsByClassName('custome_emoji_react')[0];
		const inputField = className?.childNodes[0];
		event.stopPropagation();
		event.preventDefault();

		if (EmojiPicker.isOpened()) {
			EmojiPicker.close();
		}
		EmojiPicker.open(inputField, (emoji: any) => {
			const emojiValue = `:${emoji}:`;
			inputField.focus();

			if (!document.execCommand || !document.execCommand('insertText', false, emojiValue)) {
				inputField.focus();
			}
		});
	};
	return (
		<Modal>
			<Modal.Header>
				<Icon size={24} name='info' />
				<Modal.Title>{t('Edit_Status')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				<FieldGroup>
					<Field>
						<Field.Label>{t('StatusMessage')}</Field.Label>
						<Field.Row>
							<TextInput
								className='custome_emoji_react'
								error={statusTextError}
								disabled={!allowUserStatusMessageChange}
								flexGrow={1}
								value={statusText}
								onChange={handleStatusText}
								placeholder={t('StatusMessage_Placeholder')}
								addon={<UserStatusMenu margin='neg-x2' onChange={handleStatusType} initialStatus={statusType} />}
							/>
							<button className='rc-message-box__icon emoji-picker-icon' aria-haspopup='true'>
								<Icon name='emoji' size={24} onClick={handleEmojiPicker} />
							</button>
						</Field.Row>
						{!allowUserStatusMessageChange && <Field.Hint>{t('StatusMessage_Change_Disabled')}</Field.Hint>}
						<Field.Error>{statusTextError}</Field.Error>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end' flexGrow={1} maxWidth='full'>
					<Button ghost onClick={onClose}>
						{t('Cancel')}
					</Button>
					<Button primary onClick={handleSaveStatus} disabled={!!statusTextError}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default EditStatusModal;
