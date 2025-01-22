import type { IUser } from '@rocket.chat/core-typings';
import { Field, TextInput, FieldGroup, Modal, Button, Box, FieldLabel, FieldRow, FieldError, FieldHint } from '@rocket.chat/fuselage';
import { useEffectEvent, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useSetting, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement, ChangeEvent, ComponentProps, FormEvent } from 'react';
import { useState, useCallback } from 'react';

import UserStatusMenu from '../../../components/UserStatusMenu';
import { USER_STATUS_TEXT_MAX_LENGTH } from '../../../lib/constants';

type EditStatusModalProps = {
	onClose: () => void;
	userStatus: IUser['status'];
	userStatusText: IUser['statusText'];
};

const EditStatusModal = ({ onClose, userStatus, userStatusText }: EditStatusModalProps): ReactElement => {
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange');
	const dispatchToastMessage = useToastMessageDispatch();
	const [customStatus, setCustomStatus] = useLocalStorage<string | undefined>('Local_Custom_Status', '');
	const initialStatusText = customStatus || userStatusText;

	const t = useTranslation();
	const [statusText, setStatusText] = useState(initialStatusText);
	const [statusType, setStatusType] = useState(userStatus);
	const [statusTextError, setStatusTextError] = useState<string | undefined>();

	const setUserStatus = useEndpoint('POST', '/v1/users.setStatus');

	const handleStatusText = useEffectEvent((e: ChangeEvent<HTMLInputElement>): void => {
		setStatusText(e.currentTarget.value);

		if (statusText && statusText.length > USER_STATUS_TEXT_MAX_LENGTH) {
			return setStatusTextError(t('Max_length_is', USER_STATUS_TEXT_MAX_LENGTH));
		}

		return setStatusTextError(undefined);
	});

	const handleStatusType = (type: IUser['status']): void => setStatusType(type);

	const handleSaveStatus = useCallback(async () => {
		try {
			await setUserStatus({ message: statusText, status: statusType });
			setCustomStatus(statusText);
			dispatchToastMessage({ type: 'success', message: t('StatusMessage_Changed_Successfully') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}

		onClose();
	}, [dispatchToastMessage, setUserStatus, statusText, statusType, onClose, t]);

	return (
		<Modal
			wrapperFunction={(props: ComponentProps<typeof Box>) => (
				<Box
					is='form'
					onSubmit={(e: FormEvent) => {
						e.preventDefault();
						handleSaveStatus();
					}}
					{...props}
				/>
			)}
		>
			<Modal.Header>
				<Modal.Icon name='info' />
				<Modal.Title>{t('Edit_Status')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				<FieldGroup>
					<Field>
						<FieldLabel>{t('StatusMessage')}</FieldLabel>
						<FieldRow>
							<TextInput
								error={statusTextError}
								disabled={!allowUserStatusMessageChange}
								flexGrow={1}
								value={statusText}
								onChange={handleStatusText}
								placeholder={t('StatusMessage_Placeholder')}
								addon={<UserStatusMenu margin='neg-x2' onChange={handleStatusType} initialStatus={statusType} />}
							/>
						</FieldRow>
						{!allowUserStatusMessageChange && <FieldHint>{t('StatusMessage_Change_Disabled')}</FieldHint>}
						<FieldError>{statusTextError}</FieldError>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button secondary onClick={onClose}>
						{t('Cancel')}
					</Button>
					<Button primary type='submit' disabled={!!statusTextError}>
						{t('Save')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default EditStatusModal;
