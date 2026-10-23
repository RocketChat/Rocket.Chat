/**
 * @jest-environment-options {"url": "https://workspace.example.com/channel/general"}
 */
import { MockedServerContext } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { messageParser } from '../surfaces';

const video = (overrides: Partial<UiKit.VideoBlock> = {}): UiKit.VideoBlock => ({
	type: 'video',
	video_url: 'https://player.example.com/embed/1',
	thumbnail_url: 'https://player.example.com/thumb/1.jpg',
	alt_text: 'Release walkthrough',
	title: { type: 'plain_text', text: 'What is new' },
	title_url: 'https://example.com/release',
	provider_name: 'Example',
	author_name: 'Docs team',
	...overrides,
});

const renderVideo = (block: UiKit.VideoBlock) => render(<MockedServerContext>{messageParser.render([block])}</MockedServerContext>);

it('shows the thumbnail and only loads the player once the video is clicked', async () => {
	renderVideo(video());

	expect(screen.getByRole('img', { name: 'Release walkthrough' })).toHaveAttribute('src', 'https://player.example.com/thumb/1.jpg');
	expect(screen.queryByTitle('Release walkthrough')).not.toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'Release walkthrough' }));

	const player = screen.getByTitle('Release walkthrough');
	expect(player).toHaveAttribute('src', 'https://player.example.com/embed/1');
	expect(player).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
});

it('links the title and shows the provider and the author', () => {
	renderVideo(video());

	expect(screen.getByRole('link', { name: 'What is new' })).toHaveAttribute('href', 'https://example.com/release');
	expect(screen.getByText('Example · Docs team')).toBeInTheDocument();
});

it.each([
	['http://player.example.com/embed/1'],
	['javascript:alert(1)'],
	['/api/apps/public/app/player.html'],
	['//player.example.com/embed/1'],
	['https://workspace.example.com/api/apps/public/app/player.html'],
])('never plays %s', async (url) => {
	renderVideo(video({ video_url: url }));

	expect(screen.getByRole('button', { name: 'Release walkthrough' })).toBeDisabled();
	expect(document.querySelector('iframe')).toBeNull();
});

it('leaves out a title or description that is not text', () => {
	const button = { type: 'button', text: { type: 'plain_text', text: 'Delete' }, actionId: 'delete', appId: 'app', blockId: 'b' };
	renderVideo(video({ title: button, description: button } as any));

	expect(screen.queryByText('Delete')).not.toBeInTheDocument();
	expect(screen.getAllByRole('button')).toHaveLength(1);
});
