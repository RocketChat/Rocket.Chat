import type { IThreadMessage } from '@rocket.chat/core-typings';
import { createFakeMessage } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import ThreadMessagePreview from './ThreadMessagePreview';
import * as stories from './ThreadMessagePreview.stories';
import { mockMessageProviders } from '../../../../tests/utils/mockMessageProviders';
import { createMessageSelectionStore } from '../contexts/MessageSelectionContext';

const parent = createFakeMessage({ _id: 'main', rid: 'room', msg: 'the thread' });
const reply = createFakeMessage<IThreadMessage>({ _id: 'reply', rid: 'room', tmid: 'main', msg: 'a reply' });
const relatedData = { useParentMessage: () => ({ data: parent, isLoading: false, isError: false }) };

it('should show what the thread started with, above the reply', () => {
	render(<ThreadMessagePreview message={reply} sequential={false} />, { wrapper: mockMessageProviders({ relatedData }).wrapper });

	expect(screen.getByText('the thread')).toBeInTheDocument();
	expect(screen.getByText('a reply')).toBeInTheDocument();
});

it('should open the thread at its start from the first reply of a run', async () => {
	const { wrapper, navigation } = mockMessageProviders({ relatedData });
	render(<ThreadMessagePreview message={reply} sequential={false} />, { wrapper });

	await userEvent.click(screen.getByRole('link'));

	expect(navigation.openThread).toHaveBeenCalledWith({ rid: 'room', tmid: 'main', messageId: 'main' });
});

it('should open the thread at the reply from a later reply of a run', async () => {
	const { wrapper, navigation } = mockMessageProviders({ relatedData });
	render(<ThreadMessagePreview message={reply} sequential />, { wrapper });

	await userEvent.click(screen.getByRole('link'));

	expect(navigation.openThread).toHaveBeenCalledWith({ rid: 'room', tmid: 'main', messageId: 'reply' });
	expect(screen.queryByText('the thread')).not.toBeInTheDocument();
});

it('should toggle the selection instead of opening the thread while selecting', async () => {
	const selection = createMessageSelectionStore({ isSelecting: true });
	const { wrapper, navigation } = mockMessageProviders({ relatedData, selection });
	render(<ThreadMessagePreview message={reply} sequential={false} />, { wrapper });

	await userEvent.click(screen.getByRole('link'));

	expect(selection.isSelected('reply')).toBe(true);
	expect(navigation.openThread).not.toHaveBeenCalled();
});

it('should show the attachment description of a thread started by a file', () => {
	const file = createFakeMessage({ _id: 'main', msg: '', attachments: [{ title: 'report.pdf', description: 'quarterly report' }] });
	render(<ThreadMessagePreview message={reply} sequential={false} />, {
		wrapper: mockMessageProviders({ relatedData: { useParentMessage: () => ({ data: file, isLoading: false, isError: false }) } }).wrapper,
	});

	expect(screen.getByText('quarterly report')).toBeInTheDocument();
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations', async (_storyName, Story) => {
		const { container } = render(<Story />);

		expect(await axe(container)).toHaveNoViolations();
	});
});
