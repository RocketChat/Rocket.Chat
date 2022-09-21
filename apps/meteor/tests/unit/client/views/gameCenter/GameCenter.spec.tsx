import { ExternalComponentLocation } from '@rocket.chat/apps-engine/definition/externalComponent/IExternalComponent';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import type { IGame } from '../../../../../app/apps/client/gameCenter/GameCenter';
import GameCenter from '../../../../../app/apps/client/gameCenter/GameCenter';

const mockingUseEndpoint = (data: IGame[]) =>
	proxyquire.noCallThru().load('@rocket.chat/ui-contexts', () => ({
		useEndpoint: sinon.stub().returns(data),
	}));

const games = [
	{
		appId: 'app123',
		name: 'game01',
		description: 'nice game 01',
		icon: 'gameIcon64',
		location: ExternalComponentLocation.CONTEXTUAL_BAR,
		url: 'https://example.com/foo/bar/game-1',
		options: {
			width: 800,
			height: 600,
		},
		state: {
			currentUser: {
				id: 'user123',
				username: 'userName123',
				avatarUrl: 'https://example.com/foo/bar/game-1',
			},
			currentRoom: {
				members: [
					{
						id: 'user123',
						username: 'userName123',
						avatarUrl: 'https://example.com/foo/bar/member-avatar-1',
					},
					{
						id: 'user124',
						username: 'userName124',
						avatarUrl: 'https://example.com/foo/bar/member-avatar-2',
					},
				],
			},
		},
	},
	{
		appId: 'app124',
		name: 'game02',
		description: 'nice game 02',
		icon: 'gameIcon64',
		location: ExternalComponentLocation.MODAL,
		url: 'https://example.com/foo/bar/game-2',
	},
];

describe('<GameCenter/>', () => {
	it('should render the game center properly', async () => {
		mockingUseEndpoint(games as IGame[]);

		render(<GameCenter />);

		await waitFor(() => expect(screen.getByText('Apps_Game_Center')).to.exist);
	});
});
