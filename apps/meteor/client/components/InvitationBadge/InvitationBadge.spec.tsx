import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';

import InvitationBadge from './InvitationBadge';

const wrapper = mockAppRoot()
	.withTranslations('en', 'core', {
		Invited__date__: 'Invited {{date}}',
	})
	.build();

it('should render InvitationBadge without date', () => {
	const { baseElement } = render(<InvitationBadge />, { wrapper });
	expect(baseElement).toMatchSnapshot();
});

it('should render InvitationBadge with date ISO string', () => {
	const { baseElement } = render(<InvitationBadge invitationDate='2025-01-01T12:00:00Z' />, { wrapper });
	expect(baseElement).toMatchSnapshot();
});

it('should render InvitationBadge with Date object', () => {
	const { baseElement } = render(<InvitationBadge invitationDate={new Date('2025-02-01T12:00:00Z')} />, { wrapper });
	expect(baseElement).toMatchSnapshot();
});
