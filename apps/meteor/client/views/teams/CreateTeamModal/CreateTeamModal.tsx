import { Box, Modal, Button, TextInput, Field, ToggleSwitch, FieldGroup } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement } from 'react';

import UserAutoCompleteMultiple from '../../../components/UserAutoCompleteMultiple';
import TeamNameInput from './TeamNameInput';
import { useCreateTeamModalState } from './useCreateTeamModalState';

const CreateTeamModal = ({ onClose }: { onClose: () => void }): ReactElement => {
	const {
		name,
		nameError,
		onChangeName,
		description,
		onChangeDescription,
		type,
		onChangeType,
		readOnly,
		canChangeReadOnly,
		onChangeReadOnly,
		encrypted,
		canChangeEncrypted,
		onChangeEncrypted,
		broadcast,
		onChangeBroadcast,
		members,
		onChangeMembers,
		hasUnsavedChanges,
		isCreateButtonEnabled,
		onCreate,
	} = useCreateTeamModalState(onClose);

	const t = useTranslation();
	const focusRef = useAutoFocus<HTMLInputElement>();

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Teams_New_Title')}</Modal.Title>
				<Modal.Close title={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<Field.Label>{t('Teams_New_Name_Label')}</Field.Label>
						<Field.Row>
							<TeamNameInput
								ref={focusRef}
								private={type}
								error={hasUnsavedChanges ? nameError : undefined}
								value={name}
								onChange={onChangeName}
							/>
						</Field.Row>
						{hasUnsavedChanges && nameError && <Field.Error>{nameError}</Field.Error>}
					</Field>
					<Field>
						<Field.Label>
							{t('Teams_New_Description_Label')}{' '}
							<Box is='span' color='neutral-600'>
								({t('optional')})
							</Box>
						</Field.Label>
						<Field.Row>
							<TextInput placeholder={t('Teams_New_Description_Placeholder')} value={description} onChange={onChangeDescription} />
						</Field.Row>
					</Field>
					<Field>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Teams_New_Private_Label')}</Field.Label>
								<Field.Description>
									{type ? t('Teams_New_Private_Description_Enabled') : t('Teams_New_Private_Description_Disabled')}
								</Field.Description>
							</Box>
							<ToggleSwitch checked={type} onChange={onChangeType} />
						</Box>
					</Field>
					<Field disabled={!canChangeReadOnly}>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Teams_New_Read_only_Label')}</Field.Label>
								<Field.Description>
									{readOnly ? t('Only_authorized_users_can_write_new_messages') : t('Teams_New_Read_only_Description')}
								</Field.Description>
							</Box>
							<ToggleSwitch checked={readOnly} disabled={!canChangeReadOnly} onChange={onChangeReadOnly} />
						</Box>
					</Field>
					<Field disabled={!canChangeEncrypted}>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Teams_New_Encrypted_Label')}</Field.Label>
								<Field.Description>
									{type ? t('Teams_New_Encrypted_Description_Enabled') : t('Teams_New_Encrypted_Description_Disabled')}
								</Field.Description>
							</Box>
							<ToggleSwitch checked={encrypted} disabled={!canChangeEncrypted} onChange={onChangeEncrypted} />
						</Box>
					</Field>
					<Field>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Teams_New_Broadcast_Label')}</Field.Label>
								<Field.Description>{t('Teams_New_Broadcast_Description')}</Field.Description>
							</Box>
							<ToggleSwitch checked={broadcast} onChange={onChangeBroadcast} />
						</Box>
					</Field>
					<Field>
						<Field.Label>
							{t('Teams_New_Add_members_Label')}{' '}
							<Box is='span' color='neutral-600'>
								({t('optional')})
							</Box>
						</Field.Label>
						<UserAutoCompleteMultiple value={members} onChange={onChangeMembers} />
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={!isCreateButtonEnabled} onClick={onCreate} primary>
						{t('Create')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(CreateTeamModal);
