import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import PrioritiesTableRow from './PrioritiesTableRow';

const mockedPriority = {
	id: '1',
	i18n: 'Highest',
	sortItem: 1,
	dirty: false,
	onClick: jest.fn(),
};

const defaultContainer = document.body.appendChild(document.createElement('table')).appendChild(document.createElement('tbody'));

test('should match the translation if its the default language', async () => {
	render(<PrioritiesTableRow {...mockedPriority} />, {
		container: defaultContainer,
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', {
				Highest: mockedPriority.i18n,
			})
			.build(),
	});

	expect(screen.queryByRole('table')).toHaveTextContent(mockedPriority.i18n);
});

test('should not match the defaultText if its not the default language', async () => {
	render(<PrioritiesTableRow {...mockedPriority} />, {
		container: defaultContainer,
		wrapper: mockAppRoot()
			.withTranslations('pt-BR', 'core', {
				Highest: 'Muito Alta',
			})
			.build(),
	});

	expect(screen.queryByRole('table')).not.toHaveTextContent(mockedPriority.i18n);
});
