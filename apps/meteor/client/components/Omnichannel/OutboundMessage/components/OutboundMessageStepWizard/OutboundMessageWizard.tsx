import type { IOutboundProviderMetadata, Serialized } from '@rocket.chat/core-typings';
import type { ILivechatContactWithManagerData } from '@rocket.chat/rest-typings';
import { FormProvider, useForm } from 'react-hook-form';

import MessageStep from './steps/MessageStep';
import RecipientStep from './steps/RecipientStep';
import RepliesStep from './steps/RepliesStep';
import { StepsWizard } from '../../../../StepsWizard';

type OutboundMessageWizardProps = {
	defaultValues?: {
		contactId?: string;
		providerId?: string;
		agentId?: string;
	};
};

export type OutboundMessageFormData = {
	constactId: string;
	contact: Serialized<ILivechatContactWithManagerData>;

	providerId: string;
	provider?: IOutboundProviderMetadata;

	recipient: string;
	sender: string;

	templateId: string;
	placeholders: Record<string, string[]>;
};

export const OutboundMessageWizard = ({ defaultValues }: OutboundMessageWizardProps) => {
	const methods = useForm<OutboundMessageFormData>({ defaultValues });

	return (
		<StepsWizard>
			<FormProvider {...methods}>
				<RecipientStep />

				<MessageStep />

				<RepliesStep />
			</FormProvider>
		</StepsWizard>
	);
};
