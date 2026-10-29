import type { IRoom } from '@rocket.chat/core-typings';
import { createFakeMessage, createFakeRoom, mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import ForwardMessageAction from './ForwardMessageAction';
import { mockMessageProviders } from '../../../../../../tests/utils/mockMessageProviders';

const createRoot = () =>
	mockAppRoot().withTranslations('en', 'core', {
		Forward_message: 'Forward message',
		Action_not_available_encrypted_content: 'Action not available for encrypted content',
		Not_available_for_ABAC_enabled_rooms: 'Not available in ABAC-managed rooms',
	});

const abacAttributes = [{ key: 'department', values: ['sales'] }] as IRoom['abacAttributes'];

const renderAction = ({ encrypted = false, abac = false } = {}) => {
	const providers = mockMessageProviders({ root: createRoot() });
	const message = createFakeMessage({ _id: 'message-id', rid: 'room-id', ...(encrypted && { t: 'e2e', e2e: 'pending' }) });
	const room = createFakeRoom({ _id: 'room-id', ...(abac && { abacAttributes }) });

	const view = render(<ForwardMessageAction message={message} room={room} />, { wrapper: providers.wrapper });

	return { ...view, ...providers, message };
};

describe('ForwardMessageAction', () => {
	it('should render the forward action for normal messages', () => {
		renderAction();

		expect(screen.getByRole('button', { name: 'Forward message' })).toBeEnabled();
	});

	it('should open the forward flow for the message', async () => {
		const { interactions, message } = renderAction();

		await userEvent.click(screen.getByRole('button', { name: 'Forward message' }));

		expect(interactions.openForward).toHaveBeenCalledWith(message);
	});

	it('should be disabled for encrypted messages', () => {
		renderAction({ encrypted: true });

		expect(screen.getByRole('button', { name: 'Action not available for encrypted content' })).toBeDisabled();
	});

	it('should be disabled for ABAC rooms', () => {
		renderAction({ abac: true });

		expect(screen.getByRole('button', { name: 'Not available in ABAC-managed rooms' })).toBeDisabled();
	});

	it('should be disabled for both encrypted messages and ABAC rooms', () => {
		renderAction({ encrypted: true, abac: true });

		expect(screen.getByRole('button', { name: 'Action not available for encrypted content' })).toBeDisabled();
	});

	it.each([
		['normal messages', {}],
		['encrypted messages', { encrypted: true }],
		['ABAC rooms', { abac: true }],
	])('should have no accessibility violations for %s', async (_name, options) => {
		const { container } = renderAction(options);

		expect(await axe(container)).toHaveNoViolations();
	});
});
