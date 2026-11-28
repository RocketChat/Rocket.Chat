import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';

import ActionInputBase from './ActionInputBase';

it('describes the action button with the setting label and keeps the action as its name', () => {
	render(
		<ActionInputBase
			_id='SMTP_Test_Button'
			label='Send a test email'
			actionText={'Send_a_test_mail_to_my_user' as TranslationKey}
			sectionChanged={false}
			onAction={jest.fn()}
			packageValue=''
			disabled={false}
			hasResetButton={false}
			onChangeValue={jest.fn()}
		/>,
		{ wrapper: mockAppRoot().withTranslations('en', 'core', { Send_a_test_mail_to_my_user: 'Send a test email to my user' }).build() },
	);

	expect(screen.getByRole('button', { name: 'Send a test email to my user' })).toHaveAccessibleDescription('Send a test email');
});
