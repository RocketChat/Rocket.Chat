import type {
	ILivechatAgent,
	ILivechatDepartment,
	IOutboundProviderMetadata,
	IOutboundProviderTemplate,
	ILivechatContact,
} from '@rocket.chat/core-typings';
import { Box, Margins } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import PreviewItem from './PreviewItem';
import { formatPhoneNumber } from '../../../../../lib/formatPhoneNumber';
import TemplatePreview from '../TemplatePreview';

type OutboundMessagePreviewProps = {
	template?: IOutboundProviderTemplate;
	contactName?: ILivechatContact['name'];
	providerName?: IOutboundProviderMetadata['providerName'];
	providerType?: IOutboundProviderMetadata['providerType'];
	departmentName?: ILivechatDepartment['name'];
	agentName?: ILivechatAgent['name'];
	agentUsername?: ILivechatAgent['username'];
	sender?: string;
	recipient?: string;
	templateParameters?: Record<string, string[]>;
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
			return `${agentName || agentUsername} (${agentUsername}) ${departmentName ? `at ${departmentName}` : ''}`;
		}

		return departmentName ?? t('None');
	}, [agentName, agentUsername, departmentName, t]);

	return (
		<div>
			<ul>
				<Margins blockStart={24}>
					<Box is='li' mbs={0}>
						<PreviewItem icon='doc' label={t('Template')}>
							{template?.name || t('None')}
						</PreviewItem>
					</Box>
					<Box is='li'>
						<PreviewItem icon='user' label={t('To')}>
							{contactName ? `${contactName} ${recipient ? `(${recipient})` : ''}` : t('None')}
						</PreviewItem>
					</Box>
					<Box is='li'>
						<PreviewItem icon='send' label={t('From')}>
							{providerName ? `${providerName} ${sender ? `(${sender})` : ''}` : t('None')}
						</PreviewItem>
					</Box>
					<Box is='li'>
						<PreviewItem icon='reply' label={t('Replies')}>
							{replies}
						</PreviewItem>
					</Box>
				</Margins>
			</ul>

			{template ? (
				<Box mbs={30}>
					<TemplatePreview template={template} parameters={templateParameters} />
				</Box>
			) : null}
		</div>
	);
};

export default OutboundMessagePreview;
