import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import UserCardABACAttributes from './UserCardABACAttributes';

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		ABAC_attributes: 'ABAC Attributes',
		Attribute_based_access_control: 'Attribute-Based Access Control',
	})
	.build();

describe('UserCardABACAttributes', () => {
	it('should render with multiple attributes', () => {
		const attributes = ['Classified', 'Top Secret', 'Confidential'];
		const { baseElement } = render(<UserCardABACAttributes abacAttributes={attributes} />, { wrapper: appRoot });

		expect(baseElement).toMatchSnapshot();
		expect(screen.getByText('Classified')).toBeInTheDocument();
		expect(screen.getByText('Top Secret')).toBeInTheDocument();
		expect(screen.getByText('Confidential')).toBeInTheDocument();
	});

	it('should have no accessibility violations with multiple attributes', async () => {
		const attributes = ['Classified', 'Top Secret', 'Confidential'];
		const { container } = render(<UserCardABACAttributes abacAttributes={attributes} />, { wrapper: appRoot });

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
