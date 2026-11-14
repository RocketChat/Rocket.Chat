import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { UserCardContext } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MessageAuthorAvatar from './MessageAuthorAvatar';

const message = createFakeMessage({ u: { _id: 'alice', username: 'alice', name: 'Alice' } });

it('opens the card on hover and the user info on click, without the click reaching what is around (R14)', async () => {
	const openUserCard = jest.fn();
	const openUserInfo = jest.fn();
	const onClickAround = jest.fn();
	document.addEventListener('click', onClickAround);

	render(<MessageAuthorAvatar message={message} />, {
		wrapper: mockAppRoot()
			.wrap((children) => (
				<UserCardContext.Provider value={{ openUserCard, openUserInfo, closeUserCard: jest.fn(), triggerProps: {} }}>
					{children}
				</UserCardContext.Provider>
			))
			.build(),
	});

	const avatar = screen.getByRole('img', { hidden: true });
	await userEvent.hover(avatar);
	await userEvent.click(avatar);
	document.removeEventListener('click', onClickAround);

	expect(openUserCard).toHaveBeenCalledWith(expect.anything(), 'alice');
	expect(openUserInfo).toHaveBeenCalledWith('alice');
	expect(onClickAround).not.toHaveBeenCalled();
});

it('is hidden from assistive technology, as the name beside it is the control (R14)', () => {
	render(<MessageAuthorAvatar message={message} />, { wrapper: mockAppRoot().build() });

	expect(screen.queryByRole('img')).not.toBeInTheDocument();
});
