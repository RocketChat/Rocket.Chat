import type { IRoom } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import ForwardMessageAction from './ForwardMessageAction';
import { mockMessageProviders } from '../../../../../tests/utils/mockMessageProviders';

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
	const room = { _id: 'room-id', t: 'c', ...(abac && { abacAttributes }) } as IRoom;

	const view = render(<ForwardMessageAction message={message} room={room} />, { wrapper: providers.wrapper });

	return { ...view, ...providers, message };
};

describe('ForwardMessageAction', () => {
	it('renders the forward action enabled for normal messages (R8)', () => {
		renderAction();

		expect(screen.getByRole('button', { name: 'Forward message' })).toBeEnabled();
	});

	it('opens the forward flow for the message (R8)', async () => {
		const { interactions, message } = renderAction();

		await userEvent.click(screen.getByRole('button', { name: 'Forward message' }));

		expect(interactions.openForward).toHaveBeenCalledWith(message);
	});

	it('is disabled for encrypted messages, with a name that says why (R8)', () => {
		renderAction({ encrypted: true });

		expect(screen.getByRole('button', { name: 'Action not available for encrypted content' })).toBeDisabled();
	});

	it('is disabled for ABAC rooms, with a name that says why (R8)', () => {
		renderAction({ abac: true });

		expect(screen.getByRole('button', { name: 'Not available in ABAC-managed rooms' })).toBeDisabled();
	});

	it('says the message is encrypted when both apply (R8)', () => {
		renderAction({ encrypted: true, abac: true });

		expect(screen.getByRole('button', { name: 'Action not available for encrypted content' })).toBeDisabled();
	});

	it.each([
		['normal messages', {}],
		['encrypted messages', { encrypted: true }],
		['ABAC rooms', { abac: true }],
	])('has no accessibility violations for %s (R28)', async (_name, options) => {
		const { container } = renderAction(options);

		expect(await axe(container)).toHaveNoViolations();
	});
});
