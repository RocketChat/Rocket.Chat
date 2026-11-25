import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import type { ConferenceLinkModalProps } from './ConferenceLinkModal';
import ConferenceLinkModal from './ConferenceLinkModal';
import * as stories from './ConferenceLinkModal.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

const renderModal = (props: Partial<ConferenceLinkModalProps> = {}) => {
	const onConfirm = jest.fn();
	const onClose = jest.fn();
	const dispatchToastMessage = jest.fn();
	render(<ConferenceLinkModal mode='create' onConfirm={onConfirm} onClose={onClose} {...props} />, {
		wrapper: mockAppRoot().withToastMessageDispatch(dispatchToastMessage).build(),
	});
	return { onConfirm, onClose, dispatchToastMessage };
};

const getInput = () => screen.getByRole('textbox', { name: 'Conference_link_name' });

const describedBy = (input: HTMLElement) =>
	(input.getAttribute('aria-describedby') ?? '')
		.split(' ')
		.filter(Boolean)
		.map((id) => document.getElementById(id));

describe('ConferenceLinkModal', () => {
	// Played first: the required-error story is the state its `play` leaves behind.
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { baseElement, container } = render(<Story />, { wrapper: mockAppRoot().build() });
		await Story.play?.({ canvasElement: container });

		// `region` off: the modal is rendered on its own here; in the product it opens over the app.
		const results = await axe(baseElement, { rules: { region: { enabled: false } } });
		expect(results).toHaveNoViolations();
	});

	it('calls onClose from Cancel and from the close button', async () => {
		const { onClose, onConfirm } = renderModal();

		await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		await userEvent.click(screen.getByRole('button', { name: 'Close' }));

		expect(onClose).toHaveBeenCalledTimes(2);
		expect(onConfirm).not.toHaveBeenCalled();
	});

	describe('create', () => {
		it('shows an empty required field labelled Conference_link_name', () => {
			renderModal();

			expect(getInput()).toHaveValue('');
			expect(getInput()).toBeRequired();
		});

		it('titles itself Create_link and shows no rename note', () => {
			renderModal();

			expect(screen.getByRole('dialog', { name: 'Create_link' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
			expect(screen.queryByText('Rename_conference_link_description')).not.toBeInTheDocument();
		});
	});

	describe('rename', () => {
		it('titles itself Rename_conference_link, prefills the title and shows the address note', () => {
			renderModal({ mode: 'rename', initialTitle: 'Weekly sync' });

			expect(screen.getByRole('dialog', { name: 'Rename_conference_link' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
			expect(getInput()).toHaveValue('Weekly sync');
			expect(describedBy(getInput())).toContain(screen.getByText('Rename_conference_link_description'));
		});

		// Renaming re-slugs the address, so an unchanged submit must not reach the server.
		it('tells the user there is nothing to save when the title did not change', async () => {
			const { onConfirm, dispatchToastMessage } = renderModal({ mode: 'rename', initialTitle: 'Weekly sync' });

			await userEvent.click(screen.getByRole('button', { name: 'Rename' }));

			await waitFor(() => expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'info', message: 'No_changes_to_save' }));
			expect(onConfirm).not.toHaveBeenCalled();
		});

		it('confirms a changed title', async () => {
			const { onConfirm, dispatchToastMessage } = renderModal({ mode: 'rename', initialTitle: 'Weekly sync' });

			await userEvent.clear(getInput());
			await userEvent.type(getInput(), 'Design review');
			await userEvent.click(screen.getByRole('button', { name: 'Rename' }));

			await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('Design review'));
			expect(dispatchToastMessage).not.toHaveBeenCalled();
		});
	});

	describe('validation', () => {
		it('rejects an empty title with a required error and does not confirm', async () => {
			const { onConfirm } = renderModal();

			await userEvent.click(screen.getByRole('button', { name: 'Create' }));

			const alert = await screen.findByRole('alert');
			expect(alert).toHaveTextContent('Required_field');
			expect(getInput()).toHaveAttribute('aria-invalid', 'true');
			expect(describedBy(getInput())).toContain(alert);
			expect(onConfirm).not.toHaveBeenCalled();
		});

		it('keeps the submit button enabled', async () => {
			renderModal();

			expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
			await userEvent.click(screen.getByRole('button', { name: 'Create' }));
			expect(await screen.findByRole('alert')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
		});

		it('rejects a whitespace-only title', async () => {
			const { onConfirm } = renderModal();

			await userEvent.type(getInput(), '   ');
			await userEvent.click(screen.getByRole('button', { name: 'Create' }));

			expect(await screen.findByRole('alert')).toHaveTextContent('Required_field');
			expect(onConfirm).not.toHaveBeenCalled();
		});

		it('confirms with the trimmed title', async () => {
			const { onConfirm } = renderModal();

			await userEvent.type(getInput(), '  Weekly sync  ');
			await userEvent.click(screen.getByRole('button', { name: 'Create' }));

			await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('Weekly sync'));
		});
	});

	describe('submit', () => {
		it('confirms with the typed title on click and on Enter', async () => {
			const { onConfirm, dispatchToastMessage } = renderModal();

			await userEvent.type(getInput(), 'Weekly sync');
			await userEvent.click(screen.getByRole('button', { name: 'Create' }));
			await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
			expect(onConfirm).toHaveBeenCalledWith('Weekly sync');

			await userEvent.type(getInput(), '{Enter}');
			await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(2));
			expect(dispatchToastMessage).not.toHaveBeenCalled();
		});

		it('clears the required error once a title is typed', async () => {
			renderModal();

			await userEvent.click(screen.getByRole('button', { name: 'Create' }));
			expect(await screen.findByRole('alert')).toBeInTheDocument();

			await userEvent.type(getInput(), 'W');

			await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
			expect(getInput()).toHaveAttribute('aria-invalid', 'false');
		});
	});

	describe('pending', () => {
		it('shows the confirm button loading', () => {
			renderModal({ isPending: true });
			expect(screen.getByRole('button', { name: 'Create' })).toHaveClass('rcx-button--loading');
		});

		it('does not show loading when not pending', () => {
			renderModal();
			expect(screen.getByRole('button', { name: 'Create' })).not.toHaveClass('rcx-button--loading');
		});

		it('still closes while pending', async () => {
			const { onClose } = renderModal({ isPending: true });

			await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
			await userEvent.click(screen.getByRole('button', { name: 'Close' }));

			expect(onClose).toHaveBeenCalledTimes(2);
		});
	});

	describe('server error', () => {
		it('shows the error passed in on the field', () => {
			renderModal({ initialTitle: '!!!', error: 'Not a valid name' });

			const alert = screen.getByRole('alert');
			expect(alert).toHaveTextContent('Not a valid name');
			expect(getInput()).toHaveAttribute('aria-invalid', 'true');
			expect(describedBy(getInput())).toContain(alert);
		});
	});
});
