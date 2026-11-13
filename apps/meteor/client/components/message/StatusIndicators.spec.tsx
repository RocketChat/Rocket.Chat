import type { IEditedMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { MessageDisplayContext, messageDisplayDefaultValue } from '@rocket.chat/ui-message-list';
import { render, screen } from '@testing-library/react';

import StatusIndicators from './StatusIndicators';

it("writes the date of an edit in the viewer's date and time format (message-variants R15)", () => {
	const editedAt = new Date('2021-10-27T10:00:00.000Z');
	const message = createFakeMessage<IEditedMessage>({
		u: { _id: 'author', username: 'author' },
		editedAt,
		editedBy: { _id: 'editor', username: 'editor' },
	});

	render(<StatusIndicators message={message} />, {
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', { Message_has_been_edited_by_at: 'Edited by {{username}} at {{date}}' })
			.wrap((children) => (
				<MessageDisplayContext.Provider value={{ ...messageDisplayDefaultValue, formatDateAndTime: () => 'the viewer format' }}>
					{children}
				</MessageDisplayContext.Provider>
			))
			.build(),
	});

	expect(screen.getByTitle('Edited by editor at the viewer format')).toBeInTheDocument();
});
