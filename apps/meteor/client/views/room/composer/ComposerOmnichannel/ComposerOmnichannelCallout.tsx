import { Box, Button, ButtonGroup, Callout } from '@rocket.chat/fuselage';
import { useAtLeastOnePermission, useEndpoint, useRouter, useSetting } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { isSameChannel } from '../../../../../app/livechat/lib/isSameChannel';
import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import { useBlockChannel } from '../../../omnichannel/contactInfo/tabs/ContactInfoChannels/useBlockChannel';
import { useOmnichannelRoom } from '../../contexts/RoomContext';

const ComposerOmnichannelCallout = () => {
	const { t } = useTranslation();
	const room = useOmnichannelRoom();
	const { navigate, buildRoutePath } = useRouter();
	const hasLicense = useHasLicenseModule('contact-id-verification');
	const securityPrivacyRoute = buildRoutePath('/omnichannel/security-privacy');
	const shouldShowSecurityRoute = useSetting('Livechat_Require_Contact_Verification') !== 'never' || !hasLicense;

	const canViewSecurityPrivacy = useAtLeastOnePermission([
		'view-privileged-setting',
		'edit-privileged-setting',
		'manage-selected-settings',
	]);

	const {
		_id,
		v: { _id: visitorId },
		source,
		contactId,
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
			title={t('Contact_unknown')}
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
			{shouldShowSecurityRoute ? (
				<Trans i18nKey='Add_to_contact_and_enable_verification_description'>
					Add to contact list manually and
					<Box is={canViewSecurityPrivacy ? 'a' : 'span'} href={securityPrivacyRoute}>
						enable verification
					</Box>
					using multi-factor authentication.
				</Trans>
			) : (
				t('Add_to_contact_list_manually')
			)}
		</Callout>
	);
};

export default ComposerOmnichannelCallout;
