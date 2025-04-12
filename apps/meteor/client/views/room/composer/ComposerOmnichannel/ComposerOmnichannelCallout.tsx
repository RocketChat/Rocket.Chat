import { Button, ButtonGroup, Callout, IconButton } from '@rocket.chat/fuselage';
import { useSessionStorage } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useId } from 'react';
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

	const calloutDescriptionId = useId();
	const [dismissed, setDismissed] = useSessionStorage(`contact-unknown-callout-${contactId}`, false);

	const getContactById = useEndpoint('GET', '/v1/omnichannel/contacts.get');
	const { data } = useQuery({ queryKey: ['getContactById', contactId], queryFn: () => getContactById({ contactId }) });

	const association = { visitorId, source };
	const currentChannel = data?.contact?.channels?.find((channel) => isSameChannel(channel.visitor, association));

	const handleBlock = useBlockChannel({ blocked: currentChannel?.blocked || false, association });

	if (dismissed || !data?.contact?.unknown) {
		return null;
	}

	return (
		<Callout
			role='status'
			aria-labelledby={calloutDescriptionId}
			mbe={16}
			actions={
				<ButtonGroup>
					<Button onClick={() => navigate(`/live/${_id}/contact-profile/edit`)} small>
						{t('Add_contact')}
					</Button>
					<Button danger secondary small onClick={handleBlock}>
						{currentChannel?.blocked ? t('Unblock') : t('Block')}
					</Button>
					<IconButton icon='cross' secondary small title={t('Dismiss')} onClick={() => setDismissed(true)} />
				</ButtonGroup>
			}
		>
			<p id={calloutDescriptionId}>{t('Unknown_contact_callout_description')}</p>
		</Callout>
	);
};

export default ComposerOmnichannelCallout;
