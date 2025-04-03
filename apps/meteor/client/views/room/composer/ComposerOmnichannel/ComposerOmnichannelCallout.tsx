import { Button, ButtonGroup, Callout, IconButton } from '@rocket.chat/fuselage';
import { useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { isSameChannel } from '../../../../../app/livechat/lib/isSameChannel';
import { useBlockChannel } from '../../../omnichannel/contactInfo/tabs/ContactInfoChannels/useBlockChannel';
import { useOmnichannelRoom } from '../../contexts/RoomContext';

const ComposerOmnichannelCallout = () => {
	const { t } = useTranslation();
	const room = useOmnichannelRoom();
	const { navigate } = useRouter();

	const {
		_id,
		v: { _id: visitorId },
		source,
		contactId,
	} = room;

	const getContactById = useEndpoint('GET', '/v1/omnichannel/contacts.get');
	const { data } = useQuery({ queryKey: ['getContactById', contactId], queryFn: () => getContactById({ contactId }) });

	const association = { visitorId, source };
	const currentChannel = data?.contact?.channels?.find((channel) => isSameChannel(channel.visitor, association));

	const handleBlock = useBlockChannel({ blocked: currentChannel?.blocked || false, association });

	if (!data?.contact?.unknown) {
		return null;
	}

	return (
		<Callout
			mbe={16}
			actions={
				<ButtonGroup>
					<Button onClick={() => navigate(`/live/${_id}/contact-profile/edit`)} small>
						{t('Add_contact')}
					</Button>
					<Button danger secondary small onClick={handleBlock}>
						{currentChannel?.blocked ? t('Unblock') : t('Block')}
					</Button>
				</ButtonGroup>
			}
		>
			{t('Unknown_contact_callout_description')}
		</Callout>
	);
};

export default ComposerOmnichannelCallout;
