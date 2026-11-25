import type { Meta, StoryObj } from '@storybook/react';
import { useTranslation } from 'react-i18next';
import { action } from 'storybook/actions';
import { userEvent, within } from 'storybook/test';

import type { ConferenceLink } from './ConferenceLink';
import VideoCallMenu from './VideoCallMenu';
import type { BuildVideoCallMenuSectionsInput } from './buildVideoCallMenuSections';
import { buildVideoCallMenuSections } from './buildVideoCallMenuSections';

const PHONE_VIEWPORTS = {
	phone: { name: 'Phone', styles: { width: '375px', height: '812px' } },
} as const;

const handlers = {
	onStart: action('onStart'),
	onCreate: action('onCreate'),
	onOpen: action('onOpen'),
	onCopy: action('onCopy'),
	onRename: action('onRename'),
	onDelete: action('onDelete'),
};

const weekly: ConferenceLink = { _id: 'weekly', title: 'Weekly sync', url: 'weekly-sync', ongoing: false };
const retro: ConferenceLink = { _id: 'retro', title: 'Sprint retro', url: 'sprint-retro', ongoing: false };
const standup: ConferenceLink = { _id: 'standup', title: 'Daily standup', url: 'daily-standup', ongoing: true };

type VideoCallMenuStoryArgs = Omit<BuildVideoCallMenuSectionsInput, 'handlers' | 't'> & { disabled?: boolean };

/** The room header's video call button, fed by the real section builder with every handler logged. */
const VideoCallMenuStory = ({ disabled, ...input }: VideoCallMenuStoryArgs) => {
	const { t } = useTranslation();

	return <VideoCallMenu title={t('Video_call')} disabled={disabled} sections={buildVideoCallMenuSections({ ...input, handlers, t })} />;
};

const openMenu = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
	await userEvent.click(await within(canvasElement).findByRole('button'));
};

const meta = {
	component: VideoCallMenuStory,
	args: {
		links: [],
		canStart: true,
		canManage: true,
		startDisabled: false,
	},
	play: openMenu,
} satisfies Meta<typeof VideoCallMenuStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NoLinks: Story = {};

export const WithLinks: Story = {
	args: { links: [weekly, retro] },
};

export const WithOngoingLink: Story = {
	args: { links: [standup, weekly] },
};

/** Without call-management only the room's links are offered. */
export const WithoutPermission: Story = {
	args: { links: [standup, weekly], canStart: false, canManage: false },
};

export const StartDisabled: Story = {
	args: { links: [weekly], startDisabled: true, startDisabledReason: 'Join the room to start a call' },
};

export const LongTitle: Story = {
	args: {
		links: [
			{
				_id: 'long',
				title: 'Quarterly planning for the platform and infrastructure teams with every stakeholder invited',
				url: 'quarterly-planning',
				ongoing: true,
			},
		],
	},
};

export const OnPhone: Story = {
	args: { links: [standup, weekly] },
	parameters: { viewport: { options: PHONE_VIEWPORTS } },
	globals: { viewport: { value: 'phone', isRotated: false } },
};
