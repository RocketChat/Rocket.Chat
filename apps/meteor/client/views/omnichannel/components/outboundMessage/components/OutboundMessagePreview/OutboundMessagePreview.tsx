import type {
	ILivechatAgent,
	ILivechatDepartment,
	IOutboundProviderMetadata,
	IOutboundProviderTemplate,
	ILivechatContact,
} from '@rocket.chat/core-typings';
import { Stack } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import PreviewItem from './PreviewItem';
import { formatPhoneNumber } from '../../../../../../lib/formatPhoneNumber';
import type { TemplateParameters } from '../../types/template';
import TemplatePreview from '../TemplatePreview';

export type OutboundMessagePreviewProps = {
	template?: IOutboundProviderTemplate;
	contactName?: ILivechatContact['name'];
	providerName?: IOutboundProviderMetadata['providerName'];
	providerType?: IOutboundProviderMetadata['providerType'];
	departmentName?: ILivechatDepartment['name'];
	agentName?: ILivechatAgent['name'];
	agentUsername?: ILivechatAgent['username'];
	sender?: string;
	recipient?: string;
	templateParameters?: TemplateParameters;
};

const formatContact = (rawValue?: string, providerType?: IOutboundProviderMetadata['providerType']) => {
	if (!rawValue) {
		return undefined;
	}

	if (providerType === 'phone') {
		return formatPhoneNumber(rawValue);
	}

	return rawValue;
};

const OutboundMessagePreview = ({
	template,
	contactName,
	providerName,
	providerType,
	departmentName,
	agentName,
	agentUsername,
	sender: rawSender,
	recipient: rawRecipient,
	templateParameters,
}: OutboundMessagePreviewProps) => {
	const { t } = useTranslation();

	const recipient = useMemo(() => formatContact(rawRecipient, providerType), [providerType, rawRecipient]);
	const sender = useMemo(() => formatContact(rawSender, providerType), [providerType, rawSender]);
	const replies = useMemo(() => {
		if (agentName) {
			return `${agentName} ${agentUsername ? `(${agentUsername})` : ''} ${departmentName ? `at ${departmentName}` : ''}`;
		}

		if (agentUsername) {
			return `@${agentUsername} ${departmentName ? `at ${departmentName}` : ''}`;
		}

		return departmentName;
	}, [agentName, agentUsername, departmentName]);

	return (
		<Stack is='section' gap='x32'>
			<ul>
				<PreviewItem icon='doc' label={t('Template')}>
					{template?.name}
				</PreviewItem>
				<PreviewItem icon='user' label={t('To')}>
					{contactName && `${contactName} ${recipient ? `(${recipient})` : ''}`}
				</PreviewItem>
				<PreviewItem icon='send' label={t('From')}>
					{providerName && `${providerName} ${sender ? `(${sender})` : ''}`}
				</PreviewItem>
				<PreviewItem icon='reply' label={t('Replies')}>
					{replies}
				</PreviewItem>
			</ul>

			{template ? <TemplatePreview template={template} parameters={templateParameters} /> : null}
		</Stack>
	);
};

export default OutboundMessagePreview;
