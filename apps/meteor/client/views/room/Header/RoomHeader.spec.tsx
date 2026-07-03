import { mockAppRoot } from '@rocket.chat/mock-providers';
import { LayoutContext, RoomToolboxContext } from '@rocket.chat/ui-contexts';
import type { RoomToolboxActionConfig, LayoutContextValue } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import RoomHeader from './RoomHeader';
import FakeRoomProvider from '../../../../tests/mocks/client/FakeRoomProvider';
import { createFakeRoom } from '../../../../tests/mocks/data';

const mockedRoom = createFakeRoom({ prid: undefined, name: 'general', fname: 'General' });
const appRoot = mockAppRoot()
	.withRoom(mockedRoom)
	.wrap((children) => <FakeRoomProvider roomOverrides={mockedRoom}>{children}</FakeRoomProvider>)
	.build();

jest.mock('../../../../app/utils/client', () => ({
	getURL: (url: string) => url,
}));

jest.mock('./ParentRoom', () => ({
	__esModule: true,
	default: jest.fn(() => <div>ParentRoom</div>),
}));

const mockUseRealRoomToolbox = { value: false };

jest.mock('./RoomToolbox', () => {
	const ActualRoomToolbox = jest.requireActual('./RoomToolbox/RoomToolbox').default;
	return {
		__esModule: true,
		default: jest.fn((props) => {
			if (mockUseRealRoomToolbox.value) {
				return <ActualRoomToolbox {...props} />;
			}
			return <div>RoomToolbox</div>;
		}),
	};
});

const mockActions: RoomToolboxActionConfig[] = [
	{ id: 'thread', icon: 'thread', title: 'Threads' as any, groups: ['channel'] },
	{ id: 'members-list', icon: 'members', title: 'Members' as any, groups: ['channel'] },
	{ id: 'discussions', icon: 'discussion', title: 'Discussions' as any, groups: ['channel'] },
	{ id: 'files', icon: 'clip', title: 'Files' as any, groups: ['channel'] },
	{ id: 'pinned-messages', icon: 'pin', title: 'Pinned Messages' as any, groups: ['channel'] },
];

const mockLayoutConfig = JSON.stringify({
	maxVisibleNormal: 2,
	items: [
		{ id: 'thread', featured: true, order: 1 },
		{ id: 'members-list', featured: false, order: 2 },
		{ id: 'discussions', featured: false, order: 3 },
	],
});

describe('RoomHeader', () => {
	describe('Toolbox', () => {
		it('should render toolbox by default', async () => {
			render(<RoomHeader room={mockedRoom} slots={{}} />, { wrapper: appRoot });
			expect(screen.getByLabelText('Toolbox_room_actions')).toBeInTheDocument();
		});

		it('should not render toolbox if roomToolbox is null and no slots are provided', () => {
			render(
				<RoomHeader
					room={mockedRoom}
					slots={{
						toolbox: {
							hidden: true,
						},
					}}
				/>,
				{ wrapper: appRoot },
			);
			expect(screen.queryByLabelText('Toolbox_room_actions')).not.toBeInTheDocument();
		});

		it('should render toolbox if slots.toolbox is provided', () => {
			render(<RoomHeader room={mockedRoom} slots={{ toolbox: {} }} />, { wrapper: appRoot });
			expect(screen.getByLabelText('Toolbox_room_actions')).toBeInTheDocument();
		});

		it('should render custom toolbox content from roomToolbox prop', () => {
			render(<RoomHeader room={mockedRoom} slots={{ toolbox: { content: <div>Custom Toolbox</div> } }} />, { wrapper: appRoot });
			expect(screen.getByText('Custom Toolbox')).toBeInTheDocument();
		});

		it('should render custom toolbox content from slots.toolbox.content', () => {
			render(<RoomHeader room={mockedRoom} slots={{ toolbox: { content: <div>Slotted Toolbox</div> } }} />, { wrapper: appRoot });
			expect(screen.getByText('Slotted Toolbox')).toBeInTheDocument();
		});
	});

	describe('Room Toolbox Layout Engine', () => {
		beforeAll(() => {
			mockUseRealRoomToolbox.value = true;
		});

		afterAll(() => {
			mockUseRealRoomToolbox.value = false;
		});

		const renderWithLayout = (
			room = mockedRoom,
			layoutContextValue?: Partial<LayoutContextValue>,
			settings = {
				Accounts_AllowFeaturePreview: true,
				Room_Toolbox_Layout: mockLayoutConfig,
			},
			featuresPreview = [{ name: 'roomToolboxLayout', value: true }],
		) => {
			const mockLayoutContextValue: LayoutContextValue = {
				isEmbedded: false,
				showTopNavbarEmbeddedLayout: false,
				isTablet: false,
				isMobile: false,
				roomToolboxExpanded: true,
				navbar: { searchExpanded: false },
				sidebar: {
					overlayed: false,
					setOverlayed: () => undefined,
					isCollapsed: false,
					shouldToggle: false,
					toggle: () => undefined,
					collapse: () => undefined,
					expand: () => undefined,
					close: () => undefined,
				},
				sidePanel: {
					displaySidePanel: true,
					closeSidePanel: () => undefined,
					openSidePanel: () => undefined,
				},
				size: { sidebar: '240px', contextualBar: '380px' },
				contextualBarPosition: 'relative',
				contextualBarExpanded: false,
				hiddenActions: {
					roomToolbox: [],
					messageToolbox: [],
					composerToolbox: [],
					userToolbox: [],
				},
				...layoutContextValue,
			};

			const mockToolboxValue = {
				actions: mockActions,
				openTab: () => undefined,
				closeTab: () => undefined,
			};

			const appRootWithSettings = mockAppRoot()
				.withSetting('Accounts_AllowFeaturePreview', settings.Accounts_AllowFeaturePreview)
				.withSetting('Room_Toolbox_Layout', settings.Room_Toolbox_Layout)
				.withUserPreference('featuresPreview', featuresPreview)
				.withRoom(room)
				.wrap((children) => <FakeRoomProvider roomOverrides={room}>{children}</FakeRoomProvider>)
				.build();

			return render(
				<LayoutContext.Provider value={mockLayoutContextValue}>
					<RoomToolboxContext.Provider value={mockToolboxValue}>
						<RoomHeader room={room} slots={{}} />
					</RoomToolboxContext.Provider>
				</LayoutContext.Provider>,
				{ wrapper: appRootWithSettings },
			);
		};

		const roomScenarios = [
			{ type: 'c', name: 'public-channel', title: 'Public Channel' },
			{ type: 'p', name: 'private-group', title: 'Private Group' },
			{ type: 'd', name: 'direct-message', title: 'Direct Message' },
		] as const;

		roomScenarios.forEach(({ type, name, title }) => {
			describe(`Room Type: ${title}`, () => {
				const testRoom = createFakeRoom({
					prid: undefined,
					t: type,
					name,
					fname: name,
				});

				it('should respect custom featured and visible actions layout and send remaining normal actions to options dropdown', () => {
					renderWithLayout(testRoom);

					expect(screen.getByTitle('Threads')).toBeInTheDocument();
					expect(screen.getByTitle('Members')).toBeInTheDocument();
					expect(screen.getByTitle('Discussions')).toBeInTheDocument();
					expect(screen.queryByTitle('Files')).not.toBeInTheDocument();
					expect(screen.getByTitle('Options')).toBeInTheDocument();
				});

				it('should collapse normal actions into kebab menu when roomToolboxExpanded is false (mobile viewport)', () => {
					renderWithLayout(testRoom, { roomToolboxExpanded: false });

					expect(screen.getByTitle('Threads')).toBeInTheDocument();
					expect(screen.queryByTitle('Members')).not.toBeInTheDocument();
					expect(screen.queryByTitle('Discussions')).not.toBeInTheDocument();
					expect(screen.queryByTitle('Files')).not.toBeInTheDocument();
					expect(screen.getByTitle('Options')).toBeInTheDocument();
				});

				describe('Soft Fallbacks', () => {
					it('should fallback to legacy behavior if feature preview is disabled', () => {
						renderWithLayout(testRoom, undefined, undefined, [{ name: 'roomToolboxLayout', value: false }]);

						expect(screen.getByTitle('Threads')).toBeInTheDocument();
						expect(screen.getByTitle('Members')).toBeInTheDocument();
						expect(screen.getByTitle('Discussions')).toBeInTheDocument();
						expect(screen.getByTitle('Files')).toBeInTheDocument();
						expect(screen.getByTitle('Pinned Messages')).toBeInTheDocument();
						expect(screen.queryByTitle('Options')).not.toBeInTheDocument();
					});

					it('should fallback to legacy behavior if layout configuration is malformed JSON', () => {
						renderWithLayout(testRoom, undefined, {
							Accounts_AllowFeaturePreview: true,
							Room_Toolbox_Layout: '{ invalid json }',
						});

						expect(screen.getByTitle('Threads')).toBeInTheDocument();
						expect(screen.getByTitle('Members')).toBeInTheDocument();
						expect(screen.getByTitle('Discussions')).toBeInTheDocument();
						expect(screen.getByTitle('Files')).toBeInTheDocument();
						expect(screen.getByTitle('Pinned Messages')).toBeInTheDocument();
						expect(screen.queryByTitle('Options')).not.toBeInTheDocument();
					});
				});

				describe('Accessibility (a11y)', () => {
					it('should not have any accessibility violations', async () => {
						const { container } = renderWithLayout(testRoom);

						const results = await axe(container);
						expect(results).toHaveNoViolations();
					});
				});
			});
		});
	});
});
