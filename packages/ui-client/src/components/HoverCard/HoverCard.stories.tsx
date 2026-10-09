import { Box, Button, IconButton } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';
import type { ComponentProps } from 'react';

import { HoverCard, HoverCardActions, HoverCardBand, HoverCardHeader, HoverCardInfoItem, HoverCardInfoList, HoverCardSection } from '.';

export default {
	title: 'Components/HoverCard',
	component: HoverCard,
} satisfies Meta<typeof HoverCard>;

const avatar = <Box width='x36' height='x36' borderRadius='medium' backgroundColor='surface-neutral' />;
const favorite = <IconButton icon='star' small aria-label='Favorite' />;

const Card = ({ header, band }: { header: ComponentProps<typeof HoverCardHeader>; band?: ComponentProps<typeof HoverCardBand> }) => (
	<HoverCard aria-label='Hover card'>
		{band && <HoverCardBand label={band.label}>{band.children}</HoverCardBand>}
		<HoverCardSection>
			<HoverCardHeader avatar={header.avatar} title={header.title} subtitle={header.subtitle} end={header.end} />
			<Box marginBlockStart='x16'>
				<HoverCardInfoList>
					<HoverCardInfoItem icon='at' label='Username'>
						jane.doe
					</HoverCardInfoItem>
					<HoverCardInfoItem icon='clock' label='Local time'>
						10:41 PM (UTC +1)
					</HoverCardInfoItem>
				</HoverCardInfoList>
			</Box>
		</HoverCardSection>
		<HoverCardSection tinted>
			<HoverCardActions aria-label='Actions'>
				<Button small primary>
					Open
				</Button>
				<Button small>Mark as read</Button>
			</HoverCardActions>
		</HoverCardSection>
	</HoverCard>
);

export const Default: StoryFn<typeof HoverCard> = () => <Card header={{ avatar, title: 'Title', subtitle: 'Subtitle', end: favorite }} />;

export const WithBand: StoryFn<typeof HoverCard> = () => (
	<Card
		band={{ label: 'Workspace roles', children: 'Admin, Rocket.Chat Team, Livechat Agent' }}
		header={{ avatar, title: 'Title', subtitle: 'Subtitle', end: favorite }}
	/>
);

export const WithLongBand: StoryFn<typeof HoverCard> = () => (
	<Card
		band={{
			label: 'Workspace roles',
			children: 'Admin, Rocket.Chat Team, Livechat Agent, Moderator, Owner, Leader, Bot, Guest, Anonymous, App, User',
		}}
		header={{ avatar, title: 'Title', subtitle: 'Subtitle', end: favorite }}
	/>
);

export const WithoutAvatar: StoryFn<typeof HoverCard> = () => <Card header={{ title: 'Title', subtitle: 'Subtitle', end: favorite }} />;

export const WithoutSubtitle: StoryFn<typeof HoverCard> = () => <Card header={{ avatar, title: 'Title', end: favorite }} />;

export const WithoutEndControls: StoryFn<typeof HoverCard> = () => <Card header={{ avatar, title: 'Title', subtitle: 'Subtitle' }} />;

export const LongTitleAndSubtitle: StoryFn<typeof HoverCard> = () => (
	<Card
		header={{
			avatar,
			title: 'A very long title that does not fit in the card and gets truncated',
			subtitle: 'An equally long subtitle that also does not fit and gets truncated',
			end: favorite,
		}}
	/>
);

export const HeaderOnly: StoryFn<typeof HoverCard> = () => (
	<HoverCard aria-label='Hover card'>
		<HoverCardSection>
			<HoverCardHeader avatar={avatar} title='Title' subtitle='Subtitle' end={favorite} />
		</HoverCardSection>
	</HoverCard>
);
