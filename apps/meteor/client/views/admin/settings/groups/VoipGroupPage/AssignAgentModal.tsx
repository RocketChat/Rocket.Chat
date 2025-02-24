import { Button, Modal, Select, Field, FieldGroup, FieldLabel, FieldRow, Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import type { FormEvent } from 'react';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import AutoCompleteAgentWithoutExtension from '../../../../../components/AutoCompleteAgentWithoutExtension';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';

type AssignAgentModalProps = {
	closeModal: () => void;
	reload: () => void;
	existingExtension?: string;
};

const AssignAgentModal = ({ existingExtension, closeModal, reload }: AssignAgentModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [agent, setAgent] = useState('');
	const [extension, setExtension] = useState(existingExtension || '');
	const query = useMemo(() => ({ type: 'available' as const, userId: agent }), [agent]);

	const assignAgent = useEndpoint('POST', '/v1/omnichannel/agent/extension');

	const handleAssignment = useEffectEvent(async (e: FormEvent) => {
		e.preventDefault();
		try {
			await assignAgent({ username: agent, extension });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
		reload();
		closeModal();
	});
	const handleAgentChange = useEffectEvent((e: string) => setAgent(e));

	const { value: availableExtensions, phase: state } = useEndpointData('/v1/omnichannel/extension', { params: query });

	return (
		<Modal wrapperFunction={(props) => <Box is='form' onSubmit={handleAssignment} {...props} />}>
			<Modal.Header>
				<Modal.Title>{t('Associate_Agent_to_Extension')}</Modal.Title>
				<Modal.Close onClick={closeModal} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<FieldLabel>{t('Agent_Without_Extensions')}</FieldLabel>
						<FieldRow>
							<AutoCompleteAgentWithoutExtension value={agent} onChange={handleAgentChange} currentExtension={extension} />
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>{t('Available_extensions')}</FieldLabel>
						<FieldRow>
							<Select
								disabled={state === AsyncStatePhase.LOADING || agent === ''}
								options={availableExtensions?.extensions?.map((extension) => [extension, extension]) || []}
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
					<Button primary disabled={!agent || !extension} type='submit'>
						{t('Associate')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default AssignAgentModal;
