import '@rocket.chat/fuselage/dist/fuselage.css';
import '@rocket.chat/icons/dist/rocketchat.css';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import LocalSearchOptInField from '../../../client/views/account/security/LocalSearchOptInField';
import { ResetPassphrase } from '../../../client/views/account/security/ResetPassphrase';
import EndToEndSettingsLayout from '../../../client/views/account/security/layout/EndToEndSettingsLayout';

const Root = mockAppRoot()
	.withJohnDoe()
	.withEndpoint('POST', '/v1/users.resetE2EKey', () => null)
	.withTranslations('en', 'core', {
		E2E_Local_Search_Opt_In: 'Index my encrypted messages on this device',
		E2E_Local_Search_Opt_In_Description:
			'Search encrypted messages on this device. If you disable this option, the app deletes the local index.',
		Reset_E2EE_password: 'Reset E2EE password',
		Reset_E2EE_password_description: 'Reset the key only if you cannot recover your E2EE password.',
		Reset: 'Reset',
		Cancel: 'Cancel',
		Close: 'Close',
		Are_you_sure: 'Are you sure?',
	})
	.build();

const AccountPreview = () => {
	const [checked, setChecked] = useState(false);
	return (
		<Root>
			<EndToEndSettingsLayout>
				<LocalSearchOptInField checked={checked} onChange={(event) => setChecked(event.currentTarget.checked)} />
				<ResetPassphrase />
			</EndToEndSettingsLayout>
		</Root>
	);
};

createRoot(document.getElementById('root')!).render(<AccountPreview />);
