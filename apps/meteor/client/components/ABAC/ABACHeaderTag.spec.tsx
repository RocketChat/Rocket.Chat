import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import ABACHeaderTag from './ABACHeaderTag';

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		ABAC_header_tag_title: 'Only compliant users have access to attribute-based access controlled rooms.',
		ABAC_header_tag: 'ABAC',
	})
	.build();

const createMockRoom = (overrides: Partial<IRoom> = {}) => ({
	_id: 'room-id',
	t: 'c' as const,
	name: 'test-room',
	msgs: 0,
	u: { _id: 'user-id', username: 'testuser' },
	usersCount: 1,
	_updatedAt: new Date(),
	...overrides,
});

describe('ABACHeaderTag', () => {
	it('should render the ABAC tag when room has ABAC attributes', () => {
		const room = createMockRoom({
			// @ts-expect-error to be implemented
			abacAttributes: { someAttribute: 'value' },
		});

		const { baseElement } = render(<ABACHeaderTag room={room} />, { wrapper: appRoot });
		expect(baseElement).toMatchSnapshot();
	});

	it('should not render when room has no ABAC attributes', () => {
		const room = createMockRoom();

		render(<ABACHeaderTag room={room} />, { wrapper: appRoot });
		expect(screen.queryByText('ABAC')).not.toBeInTheDocument();
	});

	it('should have no accessibility violations when rendered', async () => {
		const room = createMockRoom({
			// @ts-expect-error to be implemented
			abacAttributes: { someAttribute: 'value' },
		});

		const { container } = render(<ABACHeaderTag room={room} />, { wrapper: appRoot });
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should have no accessibility violations when not rendered', async () => {
		const room = createMockRoom();

		const { container } = render(<ABACHeaderTag room={room} />, { wrapper: appRoot });
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
