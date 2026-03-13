import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useEditRoomPermissions } from './useEditRoomPermissions';
import { createFakeRoom } from '../../../../../../tests/mocks/data';
import { useTeamInfoQuery } from '../../../../../hooks/useTeamInfoQuery';

jest.mock('../../../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomDirectives: () => ({
			allowRoomSettingChange: () => true,
		}),
	},
}));

jest.mock('../../../../../hooks/useTeamInfoQuery');

const mockUseTeamInfoQuery = useTeamInfoQuery as jest.MockedFunction<typeof useTeamInfoQuery>;

beforeEach(() => {
	mockUseTeamInfoQuery.mockReturnValue({ data: undefined } as ReturnType<typeof useTeamInfoQuery>);
});

describe('useEditRoomPermissions', () => {
	describe('canChangeType - non-team room', () => {
		it('should allow changing type from private to channel when user has create-c permission', () => {
			const room = createFakeRoom({ t: 'p', default: false });
			const wrapper = mockAppRoot().withPermission('create-c').build();

			const { result } = renderHook(() => useEditRoomPermissions(room), { wrapper });

			expect(result.current.canChangeType).toBe(true);
		});

		it('should allow changing type from channel to private when user has create-p permission', () => {
			const room = createFakeRoom({ t: 'c', default: false });
			const wrapper = mockAppRoot().withPermission('create-p').build();

			const { result } = renderHook(() => useEditRoomPermissions(room), { wrapper });

			expect(result.current.canChangeType).toBe(true);
		});

		it('should not allow changing type when user lacks the required permission', () => {
			const room = createFakeRoom({ t: 'p', default: false });
			const wrapper = mockAppRoot().build();

			const { result } = renderHook(() => useEditRoomPermissions(room), { wrapper });

			expect(result.current.canChangeType).toBe(false);
		});
	});

	describe('canChangeType - team main room', () => {
		const teamRoomId = 'team-room-id';

		beforeEach(() => {
			mockUseTeamInfoQuery.mockReturnValue({ data: { roomId: teamRoomId } } as ReturnType<typeof useTeamInfoQuery>);
		});

		it('should allow changing type from private to channel when user has create-c', () => {
			const room = createFakeRoom({ t: 'p', default: false, teamId: 'team1', teamMain: true });
			const wrapper = mockAppRoot().withPermission('create-c').build();

			const { result } = renderHook(() => useEditRoomPermissions(room), { wrapper });

			expect(result.current.canChangeType).toBe(true);
		});

		it('should not allow changing type from private to channel when user lacks create-c', () => {
			const room = createFakeRoom({ t: 'p', default: false, teamId: 'team1', teamMain: true });
			const wrapper = mockAppRoot().build();

			const { result } = renderHook(() => useEditRoomPermissions(room), { wrapper });

			expect(result.current.canChangeType).toBe(false);
		});
	});

	describe('canChangeType - team channel room', () => {
		const teamRoomId = 'team-room-id';

		beforeEach(() => {
			mockUseTeamInfoQuery.mockReturnValue({ data: { roomId: teamRoomId } } as ReturnType<typeof useTeamInfoQuery>);
		});

		it('should allow changing type from private to channel when user has create-team-channel', () => {
			const room = createFakeRoom({ t: 'p', default: false, teamId: 'team1' });
			const wrapper = mockAppRoot().withPermission('create-team-channel').build();

			const { result } = renderHook(() => useEditRoomPermissions(room), { wrapper });

			expect(result.current.canChangeType).toBe(true);
		});

		it('should not allow changing type from private to channel when user lacks create-team-channel', () => {
			const room = createFakeRoom({ t: 'p', default: false, teamId: 'team1' });
			const wrapper = mockAppRoot().build();

			const { result } = renderHook(() => useEditRoomPermissions(room), { wrapper });

			expect(result.current.canChangeType).toBe(false);
		});

		it('should allow changing type from channel to private when user has create-team-group', () => {
			const room = createFakeRoom({ t: 'c', default: false, teamId: 'team1' });
			const wrapper = mockAppRoot().withPermission('create-team-group').build();

			const { result } = renderHook(() => useEditRoomPermissions(room), { wrapper });

			expect(result.current.canChangeType).toBe(true);
		});

		it('should not allow changing type from channel to private when user lacks create-team-group', () => {
			const room = createFakeRoom({ t: 'c', default: false, teamId: 'team1' });
			const wrapper = mockAppRoot().build();

			const { result } = renderHook(() => useEditRoomPermissions(room), { wrapper });

			expect(result.current.canChangeType).toBe(false);
		});
	});

	describe('other permissions', () => {
		it('should reflect canSetReadOnly based on set-readonly permission', () => {
			const room = createFakeRoom({ t: 'c', default: false });
			const wrapperWith = mockAppRoot().withPermission('set-readonly').build();
			const wrapperWithout = mockAppRoot().build();

			const { result: withPerm } = renderHook(() => useEditRoomPermissions(room), { wrapper: wrapperWith });
			const { result: withoutPerm } = renderHook(() => useEditRoomPermissions(room), { wrapper: wrapperWithout });

			expect(withPerm.current.canSetReadOnly).toBe(true);
			expect(withoutPerm.current.canSetReadOnly).toBe(false);
		});

		it('should reflect canSetReactWhenReadOnly based on set-react-when-readonly permission', () => {
			const room = createFakeRoom({ t: 'c', default: false });
			const wrapperWith = mockAppRoot().withPermission('set-react-when-readonly').build();
			const wrapperWithout = mockAppRoot().build();

			const { result: withPerm } = renderHook(() => useEditRoomPermissions(room), { wrapper: wrapperWith });
			const { result: withoutPerm } = renderHook(() => useEditRoomPermissions(room), { wrapper: wrapperWithout });

			expect(withPerm.current.canSetReactWhenReadOnly).toBe(true);
			expect(withoutPerm.current.canSetReactWhenReadOnly).toBe(false);
		});

		it('should reflect canEditRoomRetentionPolicy based on edit-room-retention-policy permission', () => {
			const room = createFakeRoom({ t: 'c', default: false });
			const wrapperWith = mockAppRoot().withPermission('edit-room-retention-policy').build();
			const wrapperWithout = mockAppRoot().build();

			const { result: withPerm } = renderHook(() => useEditRoomPermissions(room), { wrapper: wrapperWith });
			const { result: withoutPerm } = renderHook(() => useEditRoomPermissions(room), { wrapper: wrapperWithout });

			expect(withPerm.current.canEditRoomRetentionPolicy).toBe(true);
			expect(withoutPerm.current.canEditRoomRetentionPolicy).toBe(false);
		});

		it('should reflect canArchiveOrUnarchive when user has archive-room permission', () => {
			const room = createFakeRoom({ t: 'c', default: false });
			const wrapper = mockAppRoot().withPermission('archive-room').build();

			const { result } = renderHook(() => useEditRoomPermissions(room), { wrapper });

			expect(result.current.canArchiveOrUnarchive).toBe(true);
		});

		it('should reflect canArchiveOrUnarchive when user has unarchive-room permission', () => {
			const room = createFakeRoom({ t: 'c', default: false });
			const wrapper = mockAppRoot().withPermission('unarchive-room').build();

			const { result } = renderHook(() => useEditRoomPermissions(room), { wrapper });

			expect(result.current.canArchiveOrUnarchive).toBe(true);
		});

		it('should return false for canArchiveOrUnarchive when user has neither permission', () => {
			const room = createFakeRoom({ t: 'c', default: false });
			const wrapper = mockAppRoot().build();

			const { result } = renderHook(() => useEditRoomPermissions(room), { wrapper });

			expect(result.current.canArchiveOrUnarchive).toBe(false);
		});
	});
});
