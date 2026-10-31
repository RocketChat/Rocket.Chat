import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './LocalSearchIndexStatus.stories';

const { Closed, Locked, Unavailable, MemoryOnly, Indexing, BackingOff, MemoryOnlyWhileIndexing, Complete, Stopped } =
	composeStories(stories);
const wrapper = mockAppRoot()
	.withTranslations('en', 'core', {
		E2E_Local_Search_Indexing_Progress_one: 'Indexing encrypted history: {{done}} of {{count}} room',
		E2E_Local_Search_Indexing_Progress_other: 'Indexing encrypted history: {{done}} of {{count}} rooms',
		E2E_Local_Search_Memory_Only: 'On this device, the app keeps the search index in memory only and builds it again after a restart.',
	})
	.build();

it.each([Closed, Complete, Stopped])('hides the status when there is no incomplete backfill (%#)', (Story) => {
	const { container } = render(<Story />, { wrapper });
	expect(container).toBeEmptyDOMElement();
});

it.each([
	['locked', Locked, 'E2E_Local_Search_Locked'],
	['unavailable', Unavailable, 'E2E_Local_Search_Unavailable'],
] as const)('announces %s local search without indexing progress', async (_status, Story, expectedCopy) => {
	const { container } = render(<Story />, { wrapper });
	expect(within(screen.getByRole('status')).getByText(expectedCopy, { exact: true })).toBeInTheDocument();
	expect(screen.queryByText(/Indexing encrypted history/)).not.toBeInTheDocument();
	expect(await axe(container)).toHaveNoViolations();
});

it.each([Indexing, BackingOff])('announces incomplete backfill progress (%#)', (Story) => {
	render(<Story />, { wrapper });
	expect(screen.getByRole('status')).toHaveTextContent('Indexing encrypted history: 12 of 40 rooms');
});

it('uses the singular room form', () => {
	render(<Indexing progress={{ status: 'indexing', rooms: 1, roomsDone: 0, roomsSkipped: 0, indexed: 0, pendingDecrypt: 0 }} />, {
		wrapper,
	});
	expect(screen.getByRole('status')).toHaveTextContent('Indexing encrypted history: 0 of 1 room');
	expect(screen.getByRole('status')).not.toHaveTextContent('rooms');
});

it('explains memory-only storage without announcing indexing', () => {
	render(<MemoryOnly />, { wrapper });
	expect(screen.getByText(/in memory only/)).toBeInTheDocument();
	expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('shows both the memory-only note and indexing progress', async () => {
	const { container } = render(<MemoryOnlyWhileIndexing />, { wrapper });
	expect(screen.getByText(/in memory only/)).toBeInTheDocument();
	expect(screen.getByRole('status')).toHaveTextContent('12 of 40 rooms');
	expect(await axe(container)).toHaveNoViolations();
});
