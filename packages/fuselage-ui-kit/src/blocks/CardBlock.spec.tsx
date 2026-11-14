import { MockedServerContext } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UiKitContext } from '../contexts/UiKitContext';
import { bannerParser, messageParser, modalParser } from '../surfaces';

const card = {
	type: 'card',
	blockId: 'weekly',
	icon: { type: 'image', image_url: 'https://example.com/icon.png', alt_text: 'Team icon' },
	hero_image: { type: 'image', image_url: 'https://example.com/hero.png', alt_text: 'Team photo' },
	title: { type: 'plain_text', text: 'Weekly standup' },
	subtitle: { type: 'plain_text', text: 'Platform team' },
	body: { type: 'plain_text', text: 'Review the sprint' },
	subtext: { type: 'plain_text', text: 'Mondays at 10' },
	actions: [{ type: 'button', actionId: 'join', text: { type: 'plain_text', text: 'Join' } }],
} as never;

it('renders every part of the card and sends a block action with the card id when a button is clicked', async () => {
	const action = jest.fn();

	render(
		<MockedServerContext>
			<UiKitContext.Provider value={{ action, updateState: jest.fn(), values: {}, appId: 'app' }}>
				{messageParser.render([card])}
			</UiKitContext.Provider>
		</MockedServerContext>,
	);

	expect(screen.getByRole('heading', { name: 'Weekly standup' })).toBeInTheDocument();
	expect(screen.getByText('Platform team')).toBeInTheDocument();
	expect(screen.getByText('Review the sprint')).toBeInTheDocument();
	expect(screen.getByText('Mondays at 10')).toBeInTheDocument();
	expect(screen.getByRole('img', { name: 'Team icon' })).toBeInTheDocument();
	expect(screen.getByRole('img', { name: 'Team photo' })).toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'Join' }));

	expect(action).toHaveBeenCalledWith(expect.objectContaining({ actionId: 'join', blockId: 'weekly' }), expect.anything());
});

it('leaves out an image whose URL is not safe', () => {
	render(
		<MockedServerContext>
			{messageParser.render([{ type: 'card', hero_image: { type: 'image', image_url: 'javascript:alert(1)', alt_text: 'Bad' } } as never])}
		</MockedServerContext>,
	);

	expect(screen.queryByRole('img', { name: 'Bad' })).not.toBeInTheDocument();
});

it('renders in a modal and not in a banner', () => {
	const { unmount } = render(<MockedServerContext>{modalParser.render([card])}</MockedServerContext>);
	expect(screen.getByRole('heading', { name: 'Weekly standup' })).toBeInTheDocument();
	unmount();

	render(<MockedServerContext>{bannerParser.render([card])}</MockedServerContext>);
	expect(screen.queryByRole('heading', { name: 'Weekly standup' })).not.toBeInTheDocument();
});
