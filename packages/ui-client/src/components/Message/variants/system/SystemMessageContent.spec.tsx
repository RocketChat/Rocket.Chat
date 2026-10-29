import { createFakeMessage } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SystemMessageContent from './SystemMessageContent';
import { mockMessageProviders } from '../../../../../tests/utils/mockMessageProviders';

it('should run the action links of a system message', async () => {
	const message = createFakeMessage({
		t: 'videoconf',
		actionLinks: [{ icon: 'video', i18nLabel: 'Join_call', label: 'Join call', method_id: 'joinJitsiCall', params: '' }],
	});
	const { wrapper, navigation } = mockMessageProviders();

	render(<SystemMessageContent message={message} />, { wrapper });
	await userEvent.click(screen.getByRole('button', { name: 'Join_call' }));

	expect(navigation.runActionLink).toHaveBeenCalledWith(message, 'joinJitsiCall');
});

it('should show the attachments of a system message', () => {
	const message = createFakeMessage({ attachments: [{ title: 'Pipeline', text: 'All checks passed.' }] });

	render(<SystemMessageContent message={message} />, { wrapper: mockMessageProviders().wrapper });

	expect(screen.getByText('Pipeline')).toBeInTheDocument();
});
