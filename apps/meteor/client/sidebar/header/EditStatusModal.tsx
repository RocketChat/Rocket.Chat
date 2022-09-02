import type { IUser } from '@rocket.chat/core-typings';
import { Field, TextInput, FieldGroup, Modal, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useSetting, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useState, ChangeEvent, useCallback } from 'react';

import UserStatusMenu from '../../components/UserStatusMenu';
import { USER_STATUS_TEXT_MAX_LENGTH } from '../../lib/constants';

type EditStatusModalProps = {
	onClose: () => void;
	userStatus: IUser['status'];
	userStatusText: IUser['statusText'];
};

const EditStatusModal = ({ onClose, userStatus, userStatusText }: EditStatusModalProps): ReactElement => {
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange');
	const dispatchToastMessage = useToastMessageDispatch();

	const t = useTranslation();
	const [statusText, setStatusText] = useState(userStatusText);
	const [statusType, setStatusType] = useState(userStatus);
	const [statusTextError, setStatusTextError] = useState<string | undefined>();

	const setUserStatus = useEndpoint('POST', '/v1/users.setStatus');

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
			await setUserStatus({ message: statusText, status: statusType });
			dispatchToastMessage({ type: 'success', message: t('StatusMessage_Changed_Successfully') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}

		onClose();
	}, [dispatchToastMessage, setUserStatus, statusText, statusType, onClose, t]);

	return (
		<Modal>
			<Modal.Header>
				<Modal.Icon name='info' />
				<Modal.Title>{t('Edit_Status')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				<FieldGroup>
					<Field>
						<Field.Label>{t('StatusMessage')}</Field.Label>
						<Field.Row>
							<TextInput
								error={statusTextError}
								disabled={!allowUserStatusMessageChange}
								flexGrow={1}
								value={statusText}
								onChange={handleStatusText}
								placeholder={t('StatusMessage_Placeholder')}
								addon={<UserStatusMenu margin='neg-x2' onChange={handleStatusType} initialStatus={statusType} />}
							/>
						</Field.Row>
						{!allowUserStatusMessageChange && <Field.Hint>{t('StatusMessage_Change_Disabled')}</Field.Hint>}
						<Field.Error>{statusTextError}</Field.Error>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button secondary onClick={onClose}>
						{t('Cancel')}
					</Button>
					<Button primary onClick={handleSaveStatus} disabled={!!statusTextError}>
						{t('Save')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default EditStatusModal;
