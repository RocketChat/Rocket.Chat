import { mockAppRoot } from '@rocket.chat/mock-providers';
import { ActionManagerContext } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ContextType } from 'react';

import UiKitBanner from './UiKitBanner';

const emitInteraction = jest.fn(async () => undefined);

const actionManager = {
	emitInteraction,
	on: jest.fn(),
	off: jest.fn(),
	disposeView: jest.fn(),
	suggestOptions: jest.fn(async () => ({})),
} as unknown as ContextType<typeof ActionManagerContext>;

const plainText = (text: string) => ({ type: 'plain_text', text }) as const;

const view: UiKit.BannerView = {
	viewId: 'view-id',
	appId: 'app',
	title: 'Survey',
	inline: false,
	variant: 'neutral',
	blocks: [
		{
			type: 'input',
			appId: 'app',
			blockId: 'name-block',
			label: plainText('Name'),
			element: { type: 'plain_text_input', appId: 'app', blockId: 'name-block', actionId: 'name', initialValue: 'Ada' },
		},
	],
};

const renderBanner = () =>
	render(<UiKitBanner key={view.viewId} initialView={view} />, {
		wrapper: mockAppRoot()
			.wrap((children) => <ActionManagerContext.Provider value={actionManager}>{children}</ActionManagerContext.Provider>)
			.build(),
	});

const closeBanner = () => userEvent.click(screen.getByRole('button'));

/** The state as the app receives it, after the trip through JSON. */
const sentState = () => {
	const call = emitInteraction.mock.calls.find((args: unknown[]) => (args[1] as UiKit.UserInteraction).type === 'viewClosed') as
		unknown[] | undefined;
	const interaction = call?.[1] as Extract<UiKit.UserInteraction, { type: 'viewClosed' }> | undefined;
	return JSON.parse(JSON.stringify((interaction?.payload as { view: { state: unknown } }).view.state));
};

beforeEach(() => {
	jest.clearAllMocks();
});

it('sends the initial values when the banner is closed', async () => {
	renderBanner();

	await closeBanner();

	expect(sentState()).toEqual({ 'name-block': { name: 'Ada' } });
});

it('sends only the initial values when the banner is closed, not what the user typed', async () => {
	renderBanner();

	await userEvent.clear(screen.getByLabelText('Name'));
	await userEvent.type(screen.getByLabelText('Name'), 'Grace');
	await closeBanner();

	expect(sentState()).toEqual({ 'name-block': { name: 'Ada' } });
});
