import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';

import '@testing-library/jest-dom';
import RemoveExtensionModal from './RemoveExtensionModal';

const appRoot = mockAppRoot().withJohnDoe();

it('should have user and extension informed', async () => {
	render(<RemoveExtensionModal name='John Doe' username='john.doe' extension='1000' onClose={() => undefined} />, {
		wrapper: appRoot.build(),
	});

	expect(screen.getByLabelText('User')).toHaveValue('John Doe');
	expect(screen.getByLabelText('Extension')).toHaveValue('1000');
});

it('should call assign endpoint and onClose when extension is removed', async () => {
	const closeFn = jest.fn();
	const assignFn = jest.fn(() => null);
	render(<RemoveExtensionModal name='John Doe' username='john.doe' extension='1000' onClose={closeFn} />, {
		wrapper: appRoot.withEndpoint('POST', '/v1/voip-freeswitch.extension.assign', assignFn).build(),
	});

	screen.getByRole('button', { name: /Remove/i, hidden: true }).click();

	await waitFor(() => expect(assignFn).toHaveBeenCalled());
	await waitFor(() => expect(closeFn).toHaveBeenCalled());
});

it('should call onClose when cancel button is clicked', () => {
	const closeFn = jest.fn();
	render(<RemoveExtensionModal name='John Doe' username='john.doe' extension='1000' onClose={closeFn} />, {
		wrapper: appRoot.build(),
	});

	screen.getByRole('button', { name: /Cancel/i, hidden: true }).click();
	expect(closeFn).toHaveBeenCalled();
});

it('should call onClose when cancel button is clicked', () => {
	const closeFn = jest.fn();
	render(<RemoveExtensionModal name='John Doe' username='john.doe' extension='1000' onClose={closeFn} />, {
		wrapper: appRoot.build(),
	});

	screen.getByRole('button', { name: /Close/i, hidden: true }).click();
	expect(closeFn).toHaveBeenCalled();
});
