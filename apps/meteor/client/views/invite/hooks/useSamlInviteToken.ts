import { useSessionStorage } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter } from '@rocket.chat/ui-contexts';

const KEY = 'saml_invite_token';

export const useSamlInviteToken = () => {
	const token = useRouteParameter('hash');
	return useSessionStorage(KEY, token || null);
};
