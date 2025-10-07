import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import UserInfoABACAttributes from './UserInfoABACAttributes';

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		ABAC_attributes: 'ABAC Attributes',
		ABAC_Attributes_description: 'Attribute-Based Access Control',
	})
	.build();

describe('UserInfoABACAttributes', () => {
	it('should render with multiple attributes', () => {
		const attributes = ['Classified', 'Top Secret', 'Confidential'];
		const { baseElement } = render(<UserInfoABACAttributes abacAttributes={attributes} />, { wrapper: appRoot });

		expect(baseElement).toMatchSnapshot();
		expect(screen.getByText('Classified')).toBeInTheDocument();
		expect(screen.getByText('Top Secret')).toBeInTheDocument();
		expect(screen.getByText('Confidential')).toBeInTheDocument();
	});

	it('should have no accessibility violations with multiple attributes', async () => {
		const attributes = ['Classified', 'Top Secret', 'Confidential'];
		const { container } = render(<UserInfoABACAttributes abacAttributes={attributes} />, { wrapper: appRoot });

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
