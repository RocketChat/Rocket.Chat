import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';

import ComposerPopupProvider from './ComposerPopupProvider';
import { createFakeRoom } from '../../../../tests/mocks/data';
import { useComposerPopupOptions } from '../contexts/ComposerPopupContext';

jest.mock('../../../../app/utils/client', () => ({
	slashCommands: {
		commands: {},
	},
}));

type PopupOptionsConsumerProps = {
	onReady: (options: ReturnType<typeof useComposerPopupOptions>) => void;
};

const PopupOptionsConsumer = ({ onReady }: PopupOptionsConsumerProps) => {
	const options = useComposerPopupOptions();

	useEffect(() => {
		onReady(options);
	}, [onReady, options]);

	return null;
};

const renderProvider = async (permissions: string[] = []) => {
	const room = createFakeRoom({ _id: 'permission-scoped-room', t: 'c' });

	const appRoot = permissions.reduce((builder, permission) => builder.withPermission(permission), mockAppRoot().withRoom(room)).build();

	let popupOptions: ReturnType<typeof useComposerPopupOptions> | undefined;

	render(
		<ComposerPopupProvider room={room}>
			<PopupOptionsConsumer
				onReady={(options) => {
					popupOptions = options;
				}}
			/>
		</ComposerPopupProvider>,
		{ wrapper: appRoot },
	);

	await waitFor(() => expect(popupOptions).toBeDefined());

	const mentionPopup = popupOptions?.find(({ trigger }) => trigger === '@');
	expect(mentionPopup).toBeDefined();

	const items = await mentionPopup?.getItemsFromLocal?.('');

	return items?.map(({ _id }) => _id) ?? [];
};

describe('ComposerPopupProvider', () => {
	it('does not show @all or @here in autocomplete when user does not have permissions', async () => {
		const view = await renderProvider();

		expect(view).not.toContain('all');
		expect(view).not.toContain('here');
	});

	it('shows only @all when user has mention-all permission', async () => {
		const view = await renderProvider(['mention-all']);

		expect(view).toContain('all');
		expect(view).not.toContain('here');
	});

	it('shows only @here when user has mention-here permission', async () => {
		const view = await renderProvider(['mention-here']);

		expect(view).toContain('here');
		expect(view).not.toContain('all');
	});

	it('shows both @all and @here when user has both permissions', async () => {
		const view = await renderProvider(['mention-all', 'mention-here']);

		expect(view).toContain('all');
		expect(view).toContain('here');
	});
});
