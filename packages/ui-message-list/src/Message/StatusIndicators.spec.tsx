import type { IEditedMessage, IMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import StatusIndicators from './StatusIndicators';
import { mockMessageProviders } from '../../tests/utils/mockMessageProviders';

const author = { _id: 'author', username: 'author' };

const root = () =>
	mockAppRoot().withJohnDoe().withTranslations('en', 'core', {
		Message_has_been_edited_at: 'Edited at {{date}}',
		Message_has_been_edited_by_at: 'Edited by {{username}} at {{date}}',
	});

const renderIndicators = (message: IMessage, display = {}) =>
	render(<StatusIndicators message={message} />, {
		wrapper: mockMessageProviders({ root: root(), display: { formatDateAndTime: () => 'the viewer format', ...display } }).wrapper,
	});

it('shows each indicator with its title (R15)', () => {
	renderIndicators(createFakeMessage({ u: author, pinned: true, sentByEmail: true, t: 'e2e' } as Partial<IMessage>), {
		isTranslated: () => true,
		isFollowing: () => true,
		isStarred: () => true,
	});

	for (const title of ['Translated', 'Following', 'Message_sent_by_email', 'Message_has_been_pinned', 'Message_has_been_starred']) {
		expect(screen.getByTitle(title)).toBeInTheDocument();
	}
	expect(document.querySelector('.rcx-icon--name-key')).toBeInTheDocument();
});

it('shows nothing for a plain message (R15)', () => {
	renderIndicators(createFakeMessage({ u: author }));

	expect(screen.queryByRole('img')).not.toBeInTheDocument();
});

it("writes the edit in the viewer's date and time format, by the viewer or by someone else, drawn as danger for another editor (R15)", () => {
	const editedAt = new Date('2021-10-27T10:00:00.000Z');
	const byViewer = createFakeMessage<IEditedMessage>({
		u: { _id: 'john.doe', username: 'john.doe' },
		editedAt,
		editedBy: { _id: 'john.doe', username: 'john.doe' },
	});
	const byAnother = createFakeMessage<IEditedMessage>({ u: author, editedAt, editedBy: { _id: 'editor', username: 'editor' } });

	render(
		<>
			<StatusIndicators message={byViewer} />
			<StatusIndicators message={byAnother} />
		</>,
		{ wrapper: mockMessageProviders({ root: root(), display: { formatDateAndTime: () => 'the viewer format' } }).wrapper },
	);

	const own = screen.getByTitle('Edited at the viewer format');
	const other = screen.getByTitle('Edited by editor at the viewer format');
	expect(getComputedStyle(other).color).not.toBe(getComputedStyle(own).color);
});
