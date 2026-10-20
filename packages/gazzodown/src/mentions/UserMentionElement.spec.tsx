import { render, screen } from '@testing-library/react';

import UserMentionElement from './UserMentionElement';
import { MarkupInteractionContext } from '../MarkupInteractionContext';

const resolveUserMention = (mention: string) => ({ _id: 'jane-id', username: mention, name: 'Jane' });

it('shows no native tooltip over the user card that hovering opens', () => {
	render(
		<MarkupInteractionContext.Provider value={{ resolveUserMention, onUserMentionHover: () => () => undefined }}>
			<UserMentionElement mention='jane' />
		</MarkupInteractionContext.Provider>,
	);

	expect(screen.getByText('jane')).not.toHaveAttribute('title');
});
