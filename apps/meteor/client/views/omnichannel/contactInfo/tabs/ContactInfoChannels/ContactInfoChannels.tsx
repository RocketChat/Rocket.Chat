import type { ILivechatContact } from '@rocket.chat/core-typings';
import { Box, States, StatesIcon, StatesTitle, Throbber } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Virtuoso } from 'react-virtuoso';

import { ContextualbarContent, ContextualbarEmptyContent } from '../../../../../components/Contextualbar';
import { VirtuosoScrollbars } from '../../../../../components/CustomScrollbars';
import ContactInfoChannelsItem from './ContactInfoChannelsItem';

type ContactInfoChannelsProps = {
	contactId: ILivechatContact['_id'];
};

const ContactInfoChannels = ({ contactId }: ContactInfoChannelsProps) => {
	const t = useTranslation();

	const getContactChannels = useEndpoint('GET', '/v1/omnichannel/contacts.channels');
	const { data, isError, isLoading } = useQuery(['getContactChannels', contactId], () => getContactChannels({ contactId }));

	return (
		<ContextualbarContent paddingInline={0}>
			{isLoading && (
				<Box pi={24} pb={12}>
					<Throbber size='x12' />
				</Box>
			)}
			{isError && (
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
				</States>
			)}
			{data?.channels?.length === 0 && (
				<ContextualbarEmptyContent icon='balloon' title={t('No_channels_yet')} subtitle={t('No_channels_yet_description')} />
			)}
			{!isError && data?.channels && data.channels.length > 0 && (
				<>
					<Box is='span' fontScale='p2' pbs={24} pis={24} mbe={8}>
						{t('Last_contacts')}
					</Box>
					<Box role='list' flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
						<Virtuoso
							totalCount={data.channels.length}
							overscan={25}
							data={data?.channels}
							components={{ Scroller: VirtuosoScrollbars }}
							itemContent={(index, data) => <ContactInfoChannelsItem key={index} {...data} />}
						/>
					</Box>
				</>
			)}
		</ContextualbarContent>
	);
};

export default ContactInfoChannels;
