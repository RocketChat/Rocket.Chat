import type { GenericMenu } from '@rocket.chat/ui-client';
import type { TFunction } from 'i18next';
import type { ComponentProps } from 'react';

import type { ConferenceLink } from './ConferenceLink';

export type VideoCallMenuSections = NonNullable<ComponentProps<typeof GenericMenu>['sections']>;

type VideoCallMenuSection = VideoCallMenuSections[number];

export type VideoCallMenuHandlers = {
	onStart: () => void;
	onCreate: () => void;
	/** Joins an ongoing link's conference, or opens the link when nothing is running. */
	onOpen: (link: ConferenceLink) => void;
	onCopy: (link: ConferenceLink) => void;
	onRename: (link: ConferenceLink) => void;
	onDelete: (link: ConferenceLink) => void;
};

export type BuildVideoCallMenuSectionsInput = {
	links: readonly ConferenceLink[];
	canStart: boolean;
	canManage: boolean;
	startDisabled: boolean;
	handlers: VideoCallMenuHandlers;
	t: TFunction;
};

const buildActionsSection = ({
	canStart,
	canManage,
	startDisabled,
	handlers,
	t,
}: BuildVideoCallMenuSectionsInput): VideoCallMenuSection | undefined => {
	const items: VideoCallMenuSection['items'] = [
		...(canStart
			? [
					{
						id: 'start-conference',
						icon: 'video' as const,
						content: t('Start_conference'),
						disabled: startDisabled,
						onClick: handlers.onStart,
					},
				]
			: []),
		...(canManage
			? [{ id: 'create-link', icon: 'link' as const, content: t('Create_link'), disabled: startDisabled, onClick: handlers.onCreate }]
			: []),
	];

	return items.length ? { items } : undefined;
};

const buildLinkItem = (link: ConferenceLink, { canManage, handlers, t }: BuildVideoCallMenuSectionsInput) => ({
	id: `link-${link._id}`,
	content: link.title,
	textValue: link.title,
	status: link.ongoing ? t('Ongoing') : undefined,
	items: [
		link.ongoing
			? { id: `link-${link._id}-join`, icon: 'phone' as const, content: t('Join_call'), onClick: () => handlers.onOpen(link) }
			: { id: `link-${link._id}-open`, icon: 'new-window' as const, content: t('Open'), onClick: () => handlers.onOpen(link) },
		{ id: `link-${link._id}-copy`, icon: 'copy' as const, content: t('Copy_link'), onClick: () => handlers.onCopy(link) },
		...(canManage
			? [
					{ id: `link-${link._id}-rename`, icon: 'pencil' as const, content: t('Rename'), onClick: () => handlers.onRename(link) },
					{
						id: `link-${link._id}-delete`,
						icon: 'trash' as const,
						content: t('Delete'),
						variant: 'danger',
						onClick: () => handlers.onDelete(link),
					},
				]
			: []),
	],
});

/**
 * The video call menu's sections for what the user may do: starting and creating links, then the room's links, each
 * with its own actions. Empty when the user may do nothing and the room has no links.
 */
export const buildVideoCallMenuSections = (input: BuildVideoCallMenuSectionsInput): VideoCallMenuSections => {
	const actions = buildActionsSection(input);
	const links: VideoCallMenuSection | undefined = input.links.length
		? { title: input.t('Conference_links'), items: input.links.map((link) => buildLinkItem(link, input)) }
		: undefined;

	return [actions, links].filter((section): section is VideoCallMenuSection => !!section);
};
