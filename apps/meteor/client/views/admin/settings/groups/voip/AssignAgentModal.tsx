import { Button, Modal, Select, Field, FieldGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useState, useMemo } from 'react';

import AutoCompleteAgentWithoutExtension from '../../../../../components/AutoCompleteAgentWithoutExtension';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';

type AssignAgentModalParams = {
	closeModal: () => void;
	reload: () => void;
	existingExtension?: string;
};

const AssignAgentModal: FC<AssignAgentModalParams> = ({ existingExtension, closeModal, reload }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [agent, setAgent] = useState('');
	const [extension, setExtension] = useState(existingExtension || '');
	const query = useMemo(() => ({ type: 'available' as const, userId: agent }), [agent]);

	const assignAgent = useEndpoint('POST', '/v1/omnichannel/agent/extension');

	const handleAssignment = useMutableCallback(async () => {
		try {
			await assignAgent({ username: agent, extension });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
		reload();
		closeModal();
	});
	const handleAgentChange = useMutableCallback((e) => setAgent(e));

	const { value: availableExtensions, phase: state } = useEndpointData('/v1/omnichannel/extension', query);

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Associate_Agent_to_Extension')}</Modal.Title>
				<Modal.Close onClick={closeModal} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<Field.Label>{t('Agent_Without_Extensions')}</Field.Label>
						<Field.Row>
							<AutoCompleteAgentWithoutExtension value={agent} onChange={handleAgentChange} currentExtension={extension} />
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>{t('Free_Extension_Numbers')}</Field.Label>
						<Field.Row>
							<Select
								disabled={state === AsyncStatePhase.LOADING || agent === ''}
								options={availableExtensions?.extensions?.map((extension) => [extension, extension]) || []}
								value={extension}
								placeholder={t('Select_an_option')}
								onChange={setExtension}
							/>
						</Field.Row>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={closeModal}>{t('Cancel')}</Button>
					<Button primary disabled={!agent || !extension} onClick={handleAssignment}>
						{t('Associate')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default AssignAgentModal;
