/* eslint-disable @typescript-eslint/naming-convention */
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import GenericUpsellModal from './GenericUpsellModal';
import * as stories from './GenericUpsellModal.stories';

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Premium_capability: 'Premium capability',
		Cancel: 'Cancel',
		Upgrade: 'Upgrade',
	})
	.build();

describe('GenericUpsellModal', () => {
	const defaultProps = {
		title: 'Test Title',
		img: 'test-image.png',
		onClose: jest.fn(),
	};

	afterEach(() => {
		jest.clearAllMocks();
	});

	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const { baseElement } = render(<Story />);
		expect(baseElement).toMatchSnapshot();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should render basic properties', () => {
		const props = {
			...defaultProps,
			subtitle: 'Test Subtitle',
			description: 'Test Description',
			onCancel: jest.fn(),
			onConfirm: jest.fn(),
		};
		render(<GenericUpsellModal {...props} />, { wrapper: appRoot });

		expect(screen.getByText('Test Title')).toBeInTheDocument();
		expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
		expect(screen.getByText('Test Description')).toBeInTheDocument();
	});

	it('should render with default confirm and cancel buttons', () => {
		render(<GenericUpsellModal {...defaultProps} onCancel={jest.fn()} onConfirm={jest.fn()} />, { wrapper: appRoot });

		expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Upgrade' })).toBeInTheDocument();
	});

	it('should render with default tagline', () => {
		render(<GenericUpsellModal {...defaultProps} />, { wrapper: appRoot });

		expect(screen.getByText('Premium capability')).toBeInTheDocument();
	});

	it('should render with img properties', () => {
		const props = {
			...defaultProps,
			onCancel: jest.fn(),
			onConfirm: jest.fn(),
			imgWidth: 300,
			imgHeight: 200,
			imgAlt: 'Alternative text',
		};
		render(<GenericUpsellModal {...props} />, { wrapper: appRoot });

		const heroImage = screen.getByRole('img');
		expect(heroImage).toHaveAttribute('src', 'test-image.png');
		expect(heroImage).toHaveAttribute('alt', 'Alternative text');
		expect(heroImage).toHaveStyle({
			width: '300px',
			height: '200px',
		});
	});
});
