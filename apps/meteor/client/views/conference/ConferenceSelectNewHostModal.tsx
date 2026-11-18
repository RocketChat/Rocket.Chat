import type { SelectOption } from '@rocket.chat/fuselage';
import {
	Button,
	Field,
	FieldLabel,
	FieldRow,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalHeaderText,
	ModalTitle,
	Select,
	Stack,
	Text,
} from '@rocket.chat/fuselage';
import type { PluginParticipant } from '@rocket.chat/ui-conference';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type ConferenceSelectNewHostModalProps = {
	/** Who could take over: everyone else in the call, as the provider listed them when the user tried to leave. */
	candidates: PluginParticipant[];
	/** Hand the call to this participant, then leave it. */
	onConfirm: (participantUuid: string) => void;
	/** Leave without handing the call to anybody. */
	onLeave: () => void;
	/** Stay in the call. */
	onCancel: () => void;
};

/**
 * Asks the call's only host who takes over before they leave it.
 *
 * The leave has been held back, so every way out of this — including closing it — is a choice the user makes:
 * hand over and leave, leave anyway, or stay.
 */
const ConferenceSelectNewHostModal = ({ candidates, onConfirm, onLeave, onCancel }: ConferenceSelectNewHostModalProps) => {
	const { t } = useTranslation();
	const selectId = useId();
	const [selected, setSelected] = useState(candidates.length === 1 ? candidates[0].uuid : undefined);

	const options = useMemo(
		(): SelectOption[] => candidates.map(({ uuid, displayName }) => [uuid, displayName || t('Unknown')]),
		[candidates, t],
	);

	return (
		<Modal>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>{t('Conference_pick_new_host')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose title={t('Close')} onClick={onCancel} />
			</ModalHeader>
			<ModalContent>
				<Stack gap='x16'>
					<Text is='p'>{t(candidates.length ? 'Conference_pick_new_host_description' : 'Conference_no_new_host_candidates')}</Text>
					{candidates.length > 0 && (
						<Field>
							<FieldLabel htmlFor={selectId}>{t('Conference_new_host')}</FieldLabel>
							<FieldRow>
								<Select
									id={selectId}
									options={options}
									value={selected}
									placeholder={t('Conference_new_host')}
									onChange={(key) => setSelected(String(key))}
								/>
							</FieldRow>
						</Field>
					)}
				</Stack>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button variant={candidates.length ? 'secondary-danger' : 'danger'} onClick={onLeave}>
						{t('Leave_without_a_host')}
					</Button>
					{candidates.length > 0 && (
						<Button variant='primary' disabled={!selected} onClick={() => selected && onConfirm(selected)}>
							{t('Make_host_and_leave')}
						</Button>
					)}
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default ConferenceSelectNewHostModal;
