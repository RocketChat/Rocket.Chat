import { useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useSamlInviteToken } from '../../invite/hooks/useSamlInviteToken';

/** Forgets the stored SAML invite token once the current URL no longer carries a SAML credential or an invite. */
export const useResetSamlInviteToken = () => {
	const [, setSamlInviteToken] = useSamlInviteToken();
	const samlCredentialToken = useSearchParameter('saml_idp_credentialToken');
	const inviteTokenHash = useRouteParameter('hash');

	useEffect(() => {
		if (!samlCredentialToken && !inviteTokenHash) {
			setSamlInviteToken(null);
		}
	}, [inviteTokenHash, samlCredentialToken, setSamlInviteToken]);
};
