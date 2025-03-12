import type { ILivechatContact } from '@rocket.chat/core-typings';
import { Box, States, StatesIcon, StatesTitle, Throbber } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import ContactInfoChannelsItem from './ContactInfoChannelsItem';
import { ContextualbarContent, ContextualbarEmptyContent } from '../../../../../components/Contextualbar';
import { VirtualizedScrollbars } from '../../../../../components/CustomScrollbars';

type ContactInfoChannelsProps = {
	contactId: ILivechatContact['_id'];
};

const ContactInfoChannels = ({ contactId }: ContactInfoChannelsProps) => {
	const { t } = useTranslation();

	const getContactChannels = useEndpoint('GET', '/v1/omnichannel/contacts.channels');
	const { data, isError, isPending } = useQuery({
		queryKey: ['getContactChannels', contactId],
		queryFn: () => getContactChannels({ contactId }),
	});

	if (isPending) {
		return (
			<ContextualbarContent>
				<Box pb={12}>
					<Throbber size='x12' />
				</Box>
			</ContextualbarContent>
		);
	}

	if (isError) {
		return (
			<ContextualbarContent paddingInline={0}>
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
				</States>
			</ContextualbarContent>
		);
	}

	return (
		<ContextualbarContent paddingInline={0}>
			{data.channels?.length === 0 && (
				<ContextualbarEmptyContent icon='balloon' title={t('No_channels_yet')} subtitle={t('No_channels_yet_description')} />
			)}
			{data.channels && data.channels.length > 0 && (
				<>
					<Box is='span' fontScale='p2' pbs={24} pis={24} mbe={8}>
						{t('Last_contacts')}
					</Box>
					<Box role='list' flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
						<VirtualizedScrollbars>
							<Virtuoso
								totalCount={data.channels.length}
								overscan={25}
								data={data?.channels}
								itemContent={(index, data) => <ContactInfoChannelsItem key={index} {...data} />}
							/>
						</VirtualizedScrollbars>
					</Box>
				</>
			)}
		</ContextualbarContent>
	);
};

export default ContactInfoChannels;
