import { afterEach, describe, it, test } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { expect } from 'expect';
import { axe } from 'jest-axe';
import type { FunctionLike } from 'jest-mock';
import { ModuleMocker } from 'jest-mock';

import GenericUpsellModal from './GenericUpsellModal';
import * as stories from './GenericUpsellModal.stories';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

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
		onClose: fn<FunctionLike>(),
	};

	afterEach(() => {
		mocker.clearAllMocks();
	});

	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

	testCases.forEach(([_storyname, Story]) => {
		test(`renders ${_storyname} without crashing`, async (t) => {
			const { baseElement } = render(<Story />, { wrapper: appRoot });
			t.assert.snapshot(baseElement);
		});
	});

	testCases.forEach(([_storyname, Story]) => {
		test(`${_storyname} should have no a11y violations`, async () => {
			const { container } = render(<Story />, { wrapper: appRoot });

			const results = await axe(container);
			expect(results).toHaveNoViolations();
		});
	});

	it('should render basic properties', () => {
		const props = {
			...defaultProps,
			subtitle: 'Test Subtitle',
			description: 'Test Description',
			onCancel: fn<FunctionLike>(),
			onConfirm: fn<FunctionLike>(),
		};
		render(<GenericUpsellModal {...props} />, { wrapper: appRoot });

		expect(screen.getByText('Test Title')).toBeInTheDocument();
		expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
		expect(screen.getByText('Test Description')).toBeInTheDocument();
	});

	it('should render with default confirm and cancel buttons', () => {
		render(<GenericUpsellModal {...defaultProps} onCancel={fn<FunctionLike>()} onConfirm={fn<FunctionLike>()} />, { wrapper: appRoot });

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
			onCancel: fn<FunctionLike>(),
			onConfirm: fn<FunctionLike>(),
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
