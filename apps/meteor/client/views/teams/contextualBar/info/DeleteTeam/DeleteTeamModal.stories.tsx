import type { StoryObj, Meta } from '@storybook/react';
import { action } from 'storybook/actions';

import DeleteTeamModal from '.';
import DeleteTeamChannels from './DeleteTeamChannels';
import DeleteTeamConfirmation from './DeleteTeamConfirmation';

export default {
	component: DeleteTeamModal,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof DeleteTeamModal>;

export const Default: StoryObj<typeof DeleteTeamModal> = {
	name: 'DeleteTeamModal',

	args: {
		teamId: '123',
		onConfirm: action('onConfirm'),
		onCancel: action('onCancel'),
	},
};

export const ChannelsStep: StoryObj<typeof DeleteTeamChannels> = {
	render: (args) => <DeleteTeamChannels {...args} />,

	args: {
		rooms: Array.from({ length: 15 }).map((_, i) => ({
			_id: `${i}`,
			fname: `Room #${i}`,
			name: `room-${i}`,
			usersCount: 10 * i,
			type: 'p',
			t: 'p',
			msgs: 10,
			u: {
				_id: 'user',
			},
			autoTranslateLanguage: 'english',
			_updatedAt: '2022-02-02 09:00',
		})),
		selectedRooms: {},
		onConfirm: action('onConfirm'),
		onCancel: action('onCancel'),
		onChangeRoomSelection: action('onChangeRoomSelection'),
		onToggleAllRooms: action('onToggleAllRooms'),
	},
};

export const ConfirmationStep: StoryObj<typeof DeleteTeamConfirmation> = {
	render: (args) => <DeleteTeamConfirmation {...args} />,

	args: {
		deletedRooms: {
			test123: {
				_id: `123`,
				fname: `Room 123`,
				name: `room-123`,
				usersCount: 10,
				t: 'p',
				msgs: 10,
				u: {
					_id: 'user',
				},
				autoTranslateLanguage: 'english',
				_updatedAt: '2022-02-02 09:00',
			},
		},
		keptRooms: {
			test123: {
				_id: `123`,
				fname: `Room 123`,
				name: `room-123`,
				usersCount: 10,
				t: 'p',
				msgs: 10,
				u: {
					_id: 'user',
				},
				autoTranslateLanguage: 'english',
				_updatedAt: '2022-02-02 09:00',
			},
		},
		onConfirm: async (_roomsToDelete) => action('onConfirm'),
		onCancel: action('onCancel'),
		onReturn: action('onReturn'),
	},
};
