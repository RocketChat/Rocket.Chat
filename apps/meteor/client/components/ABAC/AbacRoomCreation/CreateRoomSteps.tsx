import {
	Accordion,
	AccordionItem,
	Button,
	ModalContent,
	ModalFooter,
	ModalFooterAnnotation,
	ModalFooterControllers,
} from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import AbacAttributesStep from './AbacAttributesStep';
import type { useAbacCreationFlow } from './useAbacCreationFlow';
import type { AbacRoomCreation } from './useAbacRoomCreation';
import AbacMembershipPreview from '../AbacMembershipPreview/AbacMembershipPreview';

type CreateRoomStepsProps = {
	abac?: AbacRoomCreation;
	flow: ReturnType<typeof useAbacCreationFlow>;
	details: ReactNode;
	security: ReactNode;
	onCancel: () => void;
	submitDisabled: boolean;
	isSubmitting: boolean;
};

const CreateRoomSteps = ({ abac, flow, details, security, onCancel, submitDisabled, isSubmitting }: CreateRoomStepsProps) => {
	const { t } = useTranslation();
	const { step, index, total, back } = flow;
	const isStepped = total > 1;

	return (
		<>
			<ModalContent>
				{step === 'details' && (
					<>
						{details}
						{!isStepped && (
							<Accordion>
								<AccordionItem title={t('Advanced_settings')}>{security}</AccordionItem>
							</Accordion>
						)}
					</>
				)}
				{step === 'attributes' && (
					<AbacAttributesStep
						requiredKeys={abac?.requiredAttributes ?? []}
						assignable={flow.assignable.data}
						isPending={flow.assignable.isPending}
						error={flow.assignable.error}
					/>
				)}
				{step === 'security' && security}
				{step === 'preview' && (
					<AbacMembershipPreview
						data={flow.preview.data}
						isPending={flow.preview.isPending}
						isError={flow.preview.isError}
						error={flow.preview.error}
					/>
				)}
			</ModalContent>
			<ModalFooter justify={isStepped ? 'space-between' : undefined}>
				{isStepped && <ModalFooterAnnotation>{t('Step_of_total', { step: index + 1, total })}</ModalFooterAnnotation>}
				<ModalFooterControllers>
					{index === 0 ? (
						<Button onClick={onCancel}>{t('Cancel')}</Button>
					) : (
						<Button onClick={back} disabled={isSubmitting}>
							{t('Back')}
						</Button>
					)}
					<Button type='submit' primary disabled={submitDisabled || flow.isStepBlocked} loading={isSubmitting}>
						{index === total - 1 ? t('Create') : t('Next')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</>
	);
};

export default CreateRoomSteps;
