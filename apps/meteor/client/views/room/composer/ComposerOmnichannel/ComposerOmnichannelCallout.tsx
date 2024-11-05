import { Box, Button, ButtonGroup, Callout } from '@rocket.chat/fuselage';
import { useAtLeastOnePermission, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { isSameChannel } from '../../../../../app/livechat/lib/isSameChannel';
import { useBlockChannel } from '../../../omnichannel/contactInfo/tabs/ContactInfoChannels/useBlockChannel';
import { useOmnichannelRoom } from '../../contexts/RoomContext';

const ComposerOmnichannelCallout = () => {
	const { t } = useTranslation();
	const room = useOmnichannelRoom();
	const { navigate, buildRoutePath } = useRouter();
	const securityPrivacyRoute = buildRoutePath('/omnichannel/security-privacy');

	const canViewSecurityPrivacy = useAtLeastOnePermission([
		'view-privileged-setting',
		'edit-privileged-setting',
		'manage-selected-settings',
	]);

	const {
		_id,
		v: { _id: visitorId, contactId },
		source,
	} = room;

	const getContactById = useEndpoint('GET', '/v1/omnichannel/contacts.get');
	const { data } = useQuery(['getContactById', contactId], () => getContactById({ contactId }));

	const association = { visitorId, source };
	const currentChannel = data?.contact?.channels?.find((channel) => isSameChannel(channel.visitor, association));

	const handleBlock = useBlockChannel({ blocked: currentChannel?.blocked || false, association });

	if (!data?.contact?.unknown) {
		return null;
	}

	return (
		<Callout
			mbe={16}
			title={t('Contact_unverified_and_unknown')}
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
			<Trans i18nKey='Add_to_contact_or_enable_verification_description'>
				Add to contact list manually or
				<Box is={canViewSecurityPrivacy ? 'a' : 'span'} href={securityPrivacyRoute}>
					enable verification
				</Box>
				using multi-factor authentication.
			</Trans>
		</Callout>
	);
};

export default ComposerOmnichannelCallout;
