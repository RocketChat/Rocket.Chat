import nameToCharacterMapping from '@rocket.chat/icons';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ConferenceStatePage from './ConferenceStatePage.js';

const getIcon = (variation?: 'danger' | 'neutral') => {
	render(<ConferenceStatePage icon='warning' title='Something happened' variation={variation} />, { wrapper: mockAppRoot().build() });

	return screen.getByText(nameToCharacterMapping.warning, { selector: 'i' });
};

// Every page that existed before the variation was added reports a failure, and must keep looking like one.
it('draws the icon as an error by default', () => {
	expect(getIcon()).toHaveClass('rcx-states__icon', 'rcx-states__icon--danger');
});

it('draws the icon without the danger class when neutral', () => {
	const icon = getIcon('neutral');

	expect(icon).toHaveClass('rcx-states__icon');
	expect(icon).not.toHaveClass('rcx-states__icon--danger');
});
