import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import RoomInfoABACSection from './RoomInfoABACSection';
import { createFakeRoom } from '../../../../../../../tests/mocks/data';

type RoomWithABAC = IRoom & {
	abacAttributes?: {
		key: string;
		values: string[];
	}[];
};

describe('RoomInfoABACSection', () => {
	const createRoomWithABAC = (attributes: { key: string; values: string[] }[]): RoomWithABAC => {
		const room = createFakeRoom();
		return {
			...room,
			abacAttributes: attributes,
		} as RoomWithABAC;
	};

	const appRootWithABACEnabled = mockAppRoot().withSetting('ABAC_Enabled', true).withSetting('ABAC_ShowAttributesInRooms', true).build();

	describe('Conditional rendering', () => {
		it('should return null when ABAC_Enabled is false', () => {
			const room = createRoomWithABAC([{ key: 'Test', values: ['Value1'] }]);
			const appRoot = mockAppRoot().withSetting('ABAC_Enabled', false).withSetting('ABAC_ShowAttributesInRooms', true).build();

			render(<RoomInfoABACSection room={room} />, { wrapper: appRoot });
			expect(screen.queryByText('ABAC_Managed')).not.toBeInTheDocument();
		});

		it('should return null when ABAC_ShowAttributesInRooms is false', () => {
			const room = createRoomWithABAC([{ key: 'Test', values: ['Value1'] }]);
			const appRoot = mockAppRoot().withSetting('ABAC_Enabled', true).withSetting('ABAC_ShowAttributesInRooms', false).build();

			render(<RoomInfoABACSection room={room} />, { wrapper: appRoot });
			expect(screen.queryByText('ABAC_Managed')).not.toBeInTheDocument();
		});

		it('should return null when abacAttributes is empty', () => {
			const room = createRoomWithABAC([]);
			render(<RoomInfoABACSection room={room} />, { wrapper: appRootWithABACEnabled });
			expect(screen.queryByText('ABAC_Managed')).not.toBeInTheDocument();
		});

		it('should render when all conditions are met', () => {
			const room = createRoomWithABAC([{ key: 'Test', values: ['Value1'] }]);
			render(<RoomInfoABACSection room={room} />, { wrapper: appRootWithABACEnabled });
			expect(screen.getByText('ABAC_Managed')).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have no accessibility violations', async () => {
			const room = createRoomWithABAC([
				{ key: 'Chat-sensitivity', values: ['Classified', 'Top-Secret'] },
				{ key: 'Country', values: ['US-only'] },
			]);
			const { container } = render(<RoomInfoABACSection room={room} />, { wrapper: appRootWithABACEnabled });

			const results = await axe(container);
			expect(results).toHaveNoViolations();
		});
	});
	describe('Snapshot', () => {
		it('should match the snapshot', () => {
			const room = createRoomWithABAC([
				{ key: 'Chat-sensitivity', values: ['Classified', 'Top-Secret'] },
				{ key: 'Country', values: ['US-only'] },
			]);
			const { baseElement } = render(<RoomInfoABACSection room={room} />, { wrapper: appRootWithABACEnabled });
			expect(baseElement).toMatchSnapshot();
		});
	});
});
