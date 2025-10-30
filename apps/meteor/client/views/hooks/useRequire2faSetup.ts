import { useSetting, useUser } from '@rocket.chat/ui-contexts';

import { Roles } from '../../stores';

export const useRequire2faSetup = () => {
	const user = useUser();
	const tfaEnabled = useSetting('Accounts_TwoFactorAuthentication_Enabled', false);
	const email2faEnabled = useSetting('Accounts_TwoFactorAuthentication_By_Email_Enabled', false);
	const totp2faEnabled = useSetting('Accounts_TwoFactorAuthentication_By_TOTP_Enabled', false);
	const is2FAEnabled = tfaEnabled && (email2faEnabled || totp2faEnabled);

	return Roles.use((state) => {
		if (!user || !is2FAEnabled) {
			return false;
		}

		const mandatoryRole = state.find((role) => !!role.mandatory2fa && user.roles?.includes(role._id));

		if (mandatoryRole === undefined) {
			return false;
		}

		const hasEmail2FA = !!user?.services?.email2fa?.enabled;
		const hasTotp2FA = !!user?.services?.totp?.enabled;

		const hasAnyEnabled2FA = (email2faEnabled && hasEmail2FA) || (totp2faEnabled && hasTotp2FA);

		return !hasAnyEnabled2FA;
	});
};
