import type {
	ILivechatAgent,
	ILivechatDepartment,
	IOutboundProviderMetadata,
	IOutboundProviderTemplate,
	Serialized,
	ILivechatContact,
	IOutboundProvider,
} from '@rocket.chat/core-typings';
import { Box, Margins } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import PreviewItem from './PreviewItem';
import { formatPhoneNumber } from '../../../../../lib/formatPhoneNumber';
import TemplatePreview from '../TemplatePreview';

type OutboundMessagePreviewProps = {
	template?: IOutboundProviderTemplate;
	contact?: Serialized<ILivechatContact>;
	provider?: IOutboundProviderMetadata;
	department?: Serialized<ILivechatDepartment>;
	agent?: Pick<ILivechatAgent, '_id' | 'username' | 'name' | 'status' | 'statusLivechat' | 'emails' | 'livechat' | 'phone'>;
	sender?: string;
	recipient?: string;
	templateParameters?: Record<string, string[]>;
};

const formatContact = (rawValue?: string, provider?: IOutboundProvider) => {
	if (!rawValue) {
		return undefined;
	}

	if (provider?.providerType === 'phone') {
		return formatPhoneNumber(rawValue);
	}

	return rawValue;
};

const OutboundMessagePreview = ({
	template,
	contact,
	provider,
	department,
	agent,
	sender: rawSender,
	recipient: rawRecipient,
	templateParameters,
}: OutboundMessagePreviewProps) => {
	const { t } = useTranslation();

	const recipient = useMemo(() => formatContact(rawRecipient, provider), [provider, rawRecipient]);
	const sender = useMemo(() => formatContact(rawSender, provider), [provider, rawSender]);
	const replies = useMemo(() => {
		if (agent) {
			return `${agent.name || agent.username} (${agent.username}) ${department ? `at ${department.name}` : ''}`;
		}

		if (department) {
			return department.name;
		}

		return t('None');
	}, [agent, department, t]);

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
							{contact ? `${contact.name} ${recipient ? `(${recipient})` : ''}` : t('None')}
						</PreviewItem>
					</Box>
					<Box is='li'>
						<PreviewItem icon='send' label={t('From')}>
							{provider ? `${provider.providerName} ${sender ? `(${sender})` : ''}` : t('None')}
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
