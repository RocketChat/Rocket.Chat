import { render, screen } from '@testing-library/react';

import UserMentionElement from './UserMentionElement';
import { MarkupInteractionContext } from '../MarkupInteractionContext';

const resolveUserMention = (mention: string) => ({ _id: 'jane-id', username: mention, name: 'Jane' });

it('shows no native tooltip when hovering the mention opens the user card', () => {
	render(
		<MarkupInteractionContext.Provider value={{ resolveUserMention, onUserMentionHover: () => () => undefined }}>
			<UserMentionElement mention='jane' />
		</MarkupInteractionContext.Provider>,
	);

	expect(screen.getByText('jane')).not.toHaveAttribute('title');
});

it('keeps the native tooltip when hovering the mention opens nothing', () => {
	render(
		<MarkupInteractionContext.Provider value={{ resolveUserMention }}>
			<UserMentionElement mention='jane' />
		</MarkupInteractionContext.Provider>,
	);

	expect(screen.getByText('jane')).toHaveAttribute('title', 'Mentions_user');
});
