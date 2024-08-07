import { Button, Modal, Select, Field, FieldGroup, FieldLabel, FieldRow, Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint, useTranslation, useUser } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { FC } from 'react';
import React, { useState, useMemo } from 'react';

import UserAutoComplete from '../../../../components/UserAutoComplete/UserAutoComplete';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';

type AssignExtensionModalParams = {
	closeModal: () => void;
	existingExtension?: string;
	existingUser?: string;
};

const AssignExtensionModal: FC<AssignExtensionModalParams> = ({ existingExtension, existingUser, closeModal }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const loggedUser = useUser();
	const [user, setUser] = useState(existingUser || '');
	const [extension, setExtension] = useState(existingExtension || '');
	const query = useMemo(() => ({ type: 'available' as const, username: user }), [user]);
	const queryClient = useQueryClient();
	const assignUser = useEndpoint('POST', '/v1/voip-freeswitch.extension.assign');

	const handleAssignment = useMutableCallback(async (e) => {
		e.preventDefault();
		try {
			await assignUser({ username: user, extension });

			queryClient.invalidateQueries(['users.list']);

			if (loggedUser?.username === user) {
				queryClient.invalidateQueries(['voice-call-client']);
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}

		closeModal();
	});

	const handleUserChange = useMutableCallback((e) => setUser(e));

	const { value: availableExtensions, phase: state } = useEndpointData('/v1/voip-freeswitch.extension.list', { params: query });

	return (
		<Modal wrapperFunction={(props) => <Box is='form' onSubmit={handleAssignment} {...props} />}>
			<Modal.Header>
				<Modal.Title>{t('Associate_User_to_Extension')}</Modal.Title>
				<Modal.Close onClick={closeModal} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<FieldLabel>{t('User_Without_Extensions')}</FieldLabel>
						<FieldRow>
							<UserAutoComplete
								value={user}
								onChange={handleUserChange}
								conditions={{
									$or: [
										{ freeSwitchExtension: { $exists: true, $eq: extension } },
										{ freeSwitchExtension: { $exists: false } },
										{ username: { $exists: true, $eq: user } },
									],
								}}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>{t('Free_Extension_Numbers')}</FieldLabel>
						<FieldRow>
							<Select
								disabled={state === AsyncStatePhase.LOADING || user === ''}
								options={availableExtensions?.extensions?.map(({ extension }) => [extension, extension]) || []}
								value={extension}
								placeholder={t('Select_an_option')}
								onChange={(value) => setExtension(String(value))}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={closeModal}>{t('Cancel')}</Button>
					<Button primary disabled={!user || !extension} type='submit'>
						{t('Associate')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default AssignExtensionModal;
