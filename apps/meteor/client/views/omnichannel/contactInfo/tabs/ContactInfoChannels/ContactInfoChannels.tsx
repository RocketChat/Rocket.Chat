import type { ILivechatContactChannel, Serialized } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { ContextualbarEmptyContent, ContextualbarScrollableContent } from '../../../../../components/Contextualbar';
import ContactInfoChannelsItem from './ContactInfoChannelsItem';

type ContactInfoChannelsProps = {
	channels?: Serialized<ILivechatContactChannel>[];
};

const ContactInfoChannels = ({ channels }: ContactInfoChannelsProps) => {
	const t = useTranslation();

	if (!channels || channels.length === 0) {
		return <ContextualbarEmptyContent icon='balloon' title={t('No_channels_yet')} subtitle={t('No_channels_yet_description')} />;
	}

	return (
		<>
			<Box pbs={24} pis={24} mbe={8} fontScale='p2m'>
				{t('Last_contacts')}
			</Box>
			<ContextualbarScrollableContent p={0}>
				<Box>
					{channels.map((channel) => (
						<ContactInfoChannelsItem key={channel.visitorId} {...channel} />
					))}
				</Box>
			</ContextualbarScrollableContent>
		</>
	);
};

export default ContactInfoChannels;
