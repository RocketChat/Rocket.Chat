import { Button, Field, FieldHint, FieldLabel, FieldRow, Modal } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useUser } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import UserAutoComplete from '../../../../../components/UserAutoComplete';
import type { VoiceCallOngoingSession } from '../../../../../contexts/VoiceCallContext';

type VoiceCallTransferModalProps = {
	session: VoiceCallOngoingSession;
	isLoading?: boolean;
	onCancel(): void;
	onConfirm(username: string): void;
};

export const VoiceCallTransferModal = ({ session, isLoading = false, onCancel, onConfirm }: VoiceCallTransferModalProps) => {
	const { t } = useTranslation();
	const [username, setTransferTo] = useState('');
	const user = useUser();
	const transferToId = useUniqueId();

	const getUserInfo = useEndpoint('GET', '/v1/users.info');
	const { data: targetUser, isInitialLoading: isTargetInfoLoading } = useQuery(
		['/v1/users.info', username],
		() => getUserInfo({ username }),
		{
			enabled: Boolean(username),
			select: (data) => data?.user || {},
		},
	);

	return (
		<Modal open>
			<Modal.Header>
				<Modal.Icon color='danger' name='modal-warning' />
				<Modal.Title>{t('Transfer_call')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content>
				<Field>
					<FieldLabel htmlFor={transferToId}>{t('Transfer_to')}</FieldLabel>
					<FieldRow>
						<UserAutoComplete
							id={transferToId}
							value={username}
							onChange={(target) => setTransferTo(target as string)}
							multiple={false}
							conditions={{
								freeSwitchExtension: { $exists: true, $ne: session.contact.id },
								username: { $ne: user?.username },
							}}
						/>
					</FieldRow>
					<FieldHint>{t('Select_someone_to_transfer_the_call_to')}</FieldHint>
				</Field>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button secondary onClick={onCancel}>
						{t('Cancel')}
					</Button>
					<Button
						danger
						onClick={() => targetUser?.freeSwitchExtension && onConfirm(targetUser.freeSwitchExtension)}
						disabled={!targetUser?.freeSwitchExtension}
						loading={isLoading || isTargetInfoLoading}
					>
						{t('Hang_up_and_transfer_call')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default VoiceCallTransferModal;
