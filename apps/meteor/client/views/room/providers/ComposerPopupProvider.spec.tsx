import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';

import ComposerPopupProvider from './ComposerPopupProvider';
import { useComposerPopupOptions } from '../contexts/ComposerPopupContext';
import FakeRoomProvider from '../../../../tests/mocks/client/FakeRoomProvider';
import { createFakeRoom } from '../../../../tests/mocks/data';

const mockGrantedPermissions = new Set<string>();

jest.mock('../../../../app/authorization/client', () => ({
	hasAtLeastOnePermission: (permissions: string[] | string) => {
		const permissionList = Array.isArray(permissions) ? permissions : [permissions];

		return permissionList.some((permission) => mockGrantedPermissions.has(permission));
	},
}));

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
	mockGrantedPermissions.clear();
	permissions.forEach((permission) => mockGrantedPermissions.add(permission));

	const room = createFakeRoom({ t: 'c' });
	const appRoot = mockAppRoot().build();

	let popupOptions: ReturnType<typeof useComposerPopupOptions> | undefined;

	render(
		<FakeRoomProvider roomOverrides={room}>
			<ComposerPopupProvider room={room}>
				<PopupOptionsConsumer
					onReady={(options) => {
						popupOptions = options;
					}}
				/>
			</ComposerPopupProvider>
		</FakeRoomProvider>,
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
		const itemIds = await renderProvider();

		expect(itemIds).not.toContain('all');
		expect(itemIds).not.toContain('here');
	});

	it('shows only @all when user has mention-all permission', async () => {
		const itemIds = await renderProvider(['mention-all']);

		expect(itemIds).toContain('all');
		expect(itemIds).not.toContain('here');
	});

	it('shows only @here when user has mention-here permission', async () => {
		const itemIds = await renderProvider(['mention-here']);

		expect(itemIds).toContain('here');
		expect(itemIds).not.toContain('all');
	});

	it('shows both @all and @here when user has both permissions', async () => {
		const itemIds = await renderProvider(['mention-all', 'mention-here']);

		expect(itemIds).toContain('all');
		expect(itemIds).toContain('here');
	});
});
