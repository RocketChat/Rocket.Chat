import type { ILivechatContactChannel, Serialized } from '@rocket.chat/core-typings';
import { Box, Field, Label } from '@rocket.chat/fuselage';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import ContactInfoChannelsItem from './ContactInfoChannelsItem';

type ContactInfoChannelsProps = {
	channels: Serialized<ILivechatContactChannel>[];
};

const ContactInfoChannels = ({ channels }: ContactInfoChannelsProps) => {
	const { t } = useTranslation();
	const id = useId();

	return (
		<Field>
			<Label id={`${id}-last-contacts`} is='span'>
				{t('Last_contacts')}
			</Label>

			<Box mi={-16} aria-labelledby={`${id}-last-contacts`} role='list' flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
				{channels.map((data, index) => (
					<ContactInfoChannelsItem key={index} {...data} />
				))}
			</Box>
		</Field>
	);
};

export default ContactInfoChannels;
