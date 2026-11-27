import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import DeleteConferenceLinkModal from './DeleteConferenceLinkModal';
import * as stories from './DeleteConferenceLinkModal.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

const renderModal = ({ isPending = false } = {}) => {
	const onConfirm = jest.fn();
	const onClose = jest.fn();
	render(<DeleteConferenceLinkModal linkTitle='Weekly sync' onConfirm={onConfirm} onClose={onClose} isPending={isPending} />, {
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', { Delete_conference_link_description: 'Delete {{title}}? Its address will stop working.' })
			.build(),
	});
	return { onConfirm, onClose };
};

describe('DeleteConferenceLinkModal', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { baseElement } = render(<Story />, { wrapper: mockAppRoot().build() });

		// `region` off: the modal is rendered on its own here; in the product it opens over the app.
		const results = await axe(baseElement, { rules: { region: { enabled: false } } });
		expect(results).toHaveNoViolations();
	});

	it('names the link in a danger modal', () => {
		renderModal();

		expect(screen.getByRole('dialog', { name: 'Delete_conference_link' })).toBeInTheDocument();
		expect(screen.getByText('Delete Weekly sync? Its address will stop working.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('rcx-button--danger');
	});

	it('confirms once', async () => {
		const { onConfirm, onClose } = renderModal();

		await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

		expect(onConfirm).toHaveBeenCalledTimes(1);
		expect(onClose).not.toHaveBeenCalled();
	});

	it('closes from Cancel and the close button', async () => {
		const { onConfirm, onClose } = renderModal();

		await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		await userEvent.click(screen.getByRole('button', { name: 'Close' }));

		expect(onClose).toHaveBeenCalledTimes(2);
		expect(onConfirm).not.toHaveBeenCalled();
	});

	it('shows the confirm button loading while pending', () => {
		renderModal({ isPending: true });

		expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('rcx-button--loading');
	});
});
