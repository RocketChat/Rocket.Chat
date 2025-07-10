import type {
	ILivechatAgent,
	ILivechatContact,
	ILivechatDepartment,
	IOutboundProviderMetadata,
	IOutboundProviderTemplate,
	Serialized,
} from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';

import TemplateActivityDialog from './TemplateActivityDialog';
import { ContextualbarScrollableContent } from '../../../../../../../components/Contextualbar';
import OutboundMessagePreview from '../../../../../../../components/Omnichannel/OutboundMessage/components/OutboundMessagePreview';

type TemplateActivityProps = {
	data: {
		template?: IOutboundProviderTemplate;
		templateParameters?: Record<string, string[]>;
		contact?: Serialized<ILivechatContact>;
		provider?: IOutboundProviderMetadata;
		department?: Serialized<ILivechatDepartment>;
		agent?: Pick<ILivechatAgent, '_id' | 'username' | 'name' | 'status' | 'statusLivechat' | 'emails' | 'livechat' | 'phone'>;
		sender?: string;
		recipient?: string;
	};
	onClickBack: (() => void) | undefined;
	onClose: () => void;
};

const TemplateActivity = ({ data, onClickBack, onClose }: TemplateActivityProps): ReactElement => (
	<TemplateActivityDialog onClickBack={onClickBack} onClose={onClose}>
		<ContextualbarScrollableContent>
			<OutboundMessagePreview {...data} />
		</ContextualbarScrollableContent>
	</TemplateActivityDialog>
);

export default TemplateActivity;
