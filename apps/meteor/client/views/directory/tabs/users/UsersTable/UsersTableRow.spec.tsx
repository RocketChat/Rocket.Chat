import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import UsersTableRow from './UsersTableRow';
import type { UsersTableRowProps } from './UsersTableRow';

jest.mock('@rocket.chat/ui-avatar', () => ({
	UserAvatar: () => null,
}));

jest.mock('../../../../../components/MarkdownText', () => ({
	__esModule: true,
	default: ({ content, withTruncatedText, variant }: { content: string; withTruncatedText?: boolean; variant?: string }) => (
		<div data-testid='bio' data-truncated={String(Boolean(withTruncatedText))} data-variant={variant}>
			{content}
		</div>
	),
}));

const bio =
	'A very long bio that should not overflow the row and should be truncated with an ellipsis instead of clipping abruptly mid-word.';

const baseUser: UsersTableRowProps['user'] = {
	_id: 'user1',
	username: 'jane.doe',
	name: 'Jane Doe',
	bio,
	createdAt: new Date().toISOString(),
	emails: [],
} as unknown as UsersTableRowProps['user'];

const renderRow = (user: UsersTableRowProps['user'] = baseUser) =>
	render(
		<table>
			<tbody>
				<UsersTableRow user={user} onClick={() => () => undefined} mediaQuery={false} federation={false} canViewFullOtherUserInfo={false} />
			</tbody>
		</table>,
		{ wrapper: mockAppRoot().build() },
	);

it('renders the bio with truncation enabled, matching the name/username columns', () => {
	renderRow();

	const bioElement = screen.getByTestId('bio');
	expect(bioElement).toHaveAttribute('data-truncated', 'true');
	expect(bioElement).toHaveTextContent(bio);
});

it('renders the bio as a single line, consistent with the channel/team topic columns', () => {
	renderRow();

	expect(screen.getByTestId('bio')).toHaveAttribute('data-variant', 'inlineWithoutBreaks');
});
