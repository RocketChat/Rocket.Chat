import type { ILivechatContactChannel, Serialized } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { ContextualbarEmptyContent, ContextualbarScrollableContent } from '../../../../components/Contextualbar';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import ContactInfoHistoryItem from '../components/ContactInfoHistoryItem';

type ContactInfoChannelsProps = {
	channels: Serialized<ILivechatContactChannel>[];
};

const ContactInfoChannels = ({ channels }: ContactInfoChannelsProps) => {
	const t = useTranslation();

	const blockedContacts = channels.filter((data) => data.blocked);

	console.log(channels);

	if (channels.length === 0) {
		return <ContextualbarEmptyContent icon='balloon' title={t('No_channels_yet')} subtitle={t('No_channels_yet_description')} />;
	}

	return (
		<ContextualbarScrollableContent>
			<Box fontScale='p2m'>Last contacts</Box>
			{channels.map((channel) => !channel.blocked && <ContactInfoHistoryItem key={channel.visitorId} {...channel} />)}
			{/* {blockedContacts && blockedContacts.length > 0 && (
				<>
					<Box fontScale='p2m'>Blocked contacts</Box>
					{blockedContacts.map((data) => (
						<ContactInfoHistoryItem key={data.id} name={data.name} description={data.number} time={data.ts} />
					))}
				</>
			)} */}
		</ContextualbarScrollableContent>
	);
};

export default ContactInfoChannels;
