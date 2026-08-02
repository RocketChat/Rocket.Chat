import {
	Box,
	Button,
	Modal,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalHeaderText,
	ModalIcon,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import ConferenceMemberRow from './ConferenceMemberRow';
import type { CallOutcome, ConferenceMember } from './hooks/useCallOutcome';

type CallOutcomeModalProps = {
	callId: string;
	outcome: CallOutcome;
	others: ConferenceMember[];
	/** Ringing again only makes sense where a specific person was called — a channel rings nobody in particular. */
	canRing: boolean;
	onRang: () => void;
	onStay: () => void;
	onLeave: () => void;
};

/**
 * Tells the caller their call went nowhere, without deciding for them what happens next.
 *
 * Closing the window automatically would be presumptuous: they may want to wait, or try again, and a call
 * window that vanishes reads as a crash. So the three things they might reasonably want are offered, and
 * dismissing it leaves them where they are.
 */
const CallOutcomeModal = ({ callId, outcome, others, canRing, onRang, onStay, onLeave }: CallOutcomeModalProps) => {
	const { t } = useTranslation();
	const titleId = useId();
	const dispatchToastMessage = useToastMessageDispatch();
	const ring = useEndpoint('POST', '/v1/video-conference.ring');

	const { mutate: ringAgain, isPending } = useMutation({
		mutationFn: () => ring({ callId }),
		onSuccess: () => onRang(),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	return (
		<Modal aria-labelledby={titleId}>
			<ModalHeader>
				<ModalIcon name='phone-off' />
				<ModalHeaderText>
					<ModalTitle id={titleId}>{t(outcome === 'declined' ? 'Call_was_declined' : 'Nobody_answered_the_call')}</ModalTitle>
				</ModalHeaderText>
			</ModalHeader>
			<ModalContent fontScale='p2'>
				<Box color='hint'>{t(outcome === 'declined' ? 'Call_was_declined_description' : 'Nobody_answered_the_call_description')}</Box>
				{others.map((member) => (
					<ConferenceMemberRow key={member._id} member={member} />
				))}
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button secondary onClick={onLeave}>
						{t('Leave_call')}
					</Button>
					<Button secondary onClick={onStay}>
						{t('Stay_in_the_call')}
					</Button>
					{canRing && (
						<Button primary loading={isPending} onClick={() => ringAgain()}>
							{t('Ring_again')}
						</Button>
					)}
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default CallOutcomeModal;
