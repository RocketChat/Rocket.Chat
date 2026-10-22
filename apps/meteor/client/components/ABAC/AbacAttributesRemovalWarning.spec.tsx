import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import AbacAttributesRemovalWarning from './AbacAttributesRemovalWarning';

const enforcementOn = jest.fn(() => false);

jest.mock('../../views/room/hooks/useIsAbacEnforcementOn', () => ({
	useIsAbacEnforcementOn: () => enforcementOn(),
}));

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		ABAC_Attributes_will_be_removed: "This room's ABAC attributes will be removed.",
		ABAC_Attributes_will_be_removed_from_rooms: 'ABAC attributes will be removed from {{rooms}}.',
		ABAC_Room_locked_until_attributes_reassigned: 'The room will be locked until attributes are reassigned.',
		ABAC_Rooms_locked_until_attributes_reassigned: 'These rooms will be locked until attributes are reassigned.',
	})
	.build();

describe('AbacAttributesRemovalWarning', () => {
	it('warns that the attributes will be removed, without the lock sentence while enforcement is off', () => {
		enforcementOn.mockReturnValue(false);

		render(<AbacAttributesRemovalWarning />, { wrapper: appRoot });

		expect(screen.getByText("This room's ABAC attributes will be removed.")).toBeInTheDocument();
		expect(screen.queryByText(/will be locked/)).not.toBeInTheDocument();
	});

	it('adds the lock sentence under enforcement', () => {
		enforcementOn.mockReturnValue(true);

		render(<AbacAttributesRemovalWarning />, { wrapper: appRoot });

		expect(
			screen.getByText("This room's ABAC attributes will be removed. The room will be locked until attributes are reassigned."),
		).toBeInTheDocument();
	});

	it('names the rooms that will lose their attributes', () => {
		enforcementOn.mockReturnValue(true);

		render(<AbacAttributesRemovalWarning roomNames={['finance', 'legal']} />, { wrapper: appRoot });

		expect(
			screen.getByText('ABAC attributes will be removed from finance, legal. These rooms will be locked until attributes are reassigned.'),
		).toBeInTheDocument();
	});
});
