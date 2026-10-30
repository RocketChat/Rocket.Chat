import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import EndToEnd from './EndToEnd';

jest.mock('./ChangePassphrase', () => ({ ChangePassphrase: () => <div>Change passphrase</div> }));
jest.mock('./ResetPassphrase', () => ({ ResetPassphrase: () => <div>Reset passphrase</div> }));
jest.mock('../../../lib/absoluteUrl', () => ({ absoluteUrl: () => 'https://chat.example.test/' }));
jest.mock('../../../lib/e2eeSearch/getSearchIndexBackend', () => ({ getSearchIndexBackend: () => ({}) }));

it('preserves both passphrase sections and includes the device opt-in when allowed', () => {
	render(<EndToEnd />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withSetting('E2E_Enable_Local_Search', true)
			.withTranslations('en', 'core', { E2E_Local_Search_Opt_In: 'Index encrypted messages' })
			.build(),
	});
	expect(screen.getByText('Change passphrase')).toBeInTheDocument();
	expect(screen.getByText('Reset passphrase')).toBeInTheDocument();
	expect(screen.getByRole('checkbox', { name: 'Index encrypted messages' })).not.toBeChecked();
});
