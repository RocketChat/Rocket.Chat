import type { IRoom } from '@rocket.chat/core-typings';
import { Avatar, Box } from '@rocket.chat/fuselage';
import { SettingsContext } from '@rocket.chat/ui-contexts';
import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/react';
import { ComponentProps, ComponentType } from 'react';

import {
	HeaderV2 as Header,
	HeaderV2Avatar as HeaderAvatar,
	HeaderV2Content as HeaderContent,
	HeaderV2ContentRow as HeaderContentRow,
	HeaderV2Icon as HeaderIcon,
	HeaderV2Toolbar as HeaderToolbar,
	HeaderV2ToolbarAction as HeaderToolbarAction,
	HeaderV2ToolbarActionBadge as HeaderToolbarActionBadge,
	HeaderV2Title as HeaderTitle,
	HeaderV2State as HeaderState,
} from '.';
import AnnouncementBanner from '../AnnouncementBanner';

const avatarUrl =
	'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z';

export default {
	title: 'Components/HeaderV2',
	component: Header,
	subcomponents: {
		HeaderToolbar: HeaderToolbar as ComponentType<any>,
		HeaderToolbarAction: HeaderToolbarAction as ComponentType<any>,
		HeaderAvatar: HeaderAvatar as ComponentType<any>,
		HeaderContent: HeaderContent as ComponentType<any>,
		HeaderContentRow: HeaderContentRow as ComponentType<any>,
	},
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(fn) => (
			<SettingsContext.Provider
				value={{
					hasPrivateAccess: true,
					querySetting: (_id) => [
						() => () => undefined,
						() => ({
							_id,
							type: 'action',
							value: '',
							actionText: '',
							public: true,
							blocked: false,
							createdAt: new Date(),
							env: true,
							i18nLabel: _id,
							packageValue: false,
							sorter: 1,
							ts: new Date(),
							_updatedAt: new Date(),
						}),
					],
					querySettings: () => [() => () => undefined, () => []],
					dispatch: async () => undefined,
				}}
			>
				{fn()}
			</SettingsContext.Provider>
		),
	],
} satisfies Meta<typeof Header>;

const room: IRoom = {
	t: 'c',
	name: 'general general general general general general general general general general general general general general general general general general general',
	_id: 'GENERAL',
	topic: 'lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum',
	announcement: 'Announcement',
	encrypted: true,
	autoTranslate: true,
	autoTranslateLanguage: 'pt-BR',
	u: {
		_id: 'rocket.cat',
		name: 'rocket.cat',
		username: 'rocket.cat',
	},
	msgs: 123,
	usersCount: 3,
	_updatedAt: new Date(),
} as const;

const CustomAvatar = (props: Omit<ComponentProps<typeof Avatar>, 'url'>) => <Avatar size='x28' url={avatarUrl} {...props} />;
const icon = { name: 'hash' } as const;

export const Default = () => (
	<Header>
		<HeaderAvatar>
			<CustomAvatar />
		</HeaderAvatar>
		<HeaderContent>
			<HeaderContentRow>
				{icon && <HeaderIcon icon={icon} />}
				<HeaderTitle>{room.name}</HeaderTitle>
				<HeaderState onClick={action('click')} icon='star' />
				<HeaderState icon='key' />
				<HeaderState icon='language' />
			</HeaderContentRow>
		</HeaderContent>
		<HeaderToolbar>
			<HeaderToolbarAction icon='magnifier' action={action('action')} />
			<HeaderToolbarAction icon='key' action={action('action')} />
			<HeaderToolbarAction icon='kebab' action={action('action')} />
		</HeaderToolbar>
	</Header>
);

export const WithBurger = () => (
	<Header>
		<HeaderToolbar>
			<HeaderToolbarAction icon='burger' action={action('action')} />
		</HeaderToolbar>
		<HeaderAvatar>
			<CustomAvatar />
		</HeaderAvatar>
		<HeaderContent>
			<HeaderContentRow>
				{icon && <HeaderIcon icon={icon} />}
				<HeaderTitle>{room.name}</HeaderTitle>
				<HeaderState onClick={action('onClick')} icon='star' />
				<HeaderState icon='key' />
				<HeaderState icon='language' />
			</HeaderContentRow>
		</HeaderContent>
		<HeaderToolbar>
			<HeaderToolbarAction icon='magnifier' action={action('action')} />
			<HeaderToolbarAction icon='key' action={action('action')} />
			<HeaderToolbarAction icon='kebab' action={action('action')} />
		</HeaderToolbar>
	</Header>
);

export const WithActionBadge = () => (
	<Header>
		<HeaderAvatar>
			<CustomAvatar />
		</HeaderAvatar>
		<HeaderContent>
			<HeaderContentRow>
				{icon && <HeaderIcon icon={icon} />}
				<HeaderTitle>{room.name}</HeaderTitle>
				<HeaderState onClick={action('onClick')} icon='star' />
			</HeaderContentRow>
		</HeaderContent>
		<HeaderToolbar>
			<HeaderToolbarAction icon='phone' action={action('action')}>
				<HeaderToolbarActionBadge variant='primary'>1</HeaderToolbarActionBadge>
			</HeaderToolbarAction>
			<HeaderToolbarAction icon='phone' action={action('action')}>
				<HeaderToolbarActionBadge variant='danger'>2</HeaderToolbarActionBadge>
			</HeaderToolbarAction>
			<HeaderToolbarAction icon='phone' action={action('action')}>
				<HeaderToolbarActionBadge variant='warning'>99</HeaderToolbarActionBadge>
			</HeaderToolbarAction>
			<HeaderToolbarAction icon='kebab' action={action('action')} />
		</HeaderToolbar>
	</Header>
);

export const WithTopic = () => (
	<>
		<Header>
			<HeaderAvatar>
				<CustomAvatar />
			</HeaderAvatar>
			<HeaderContent>
				<HeaderContentRow>
					{icon && <HeaderIcon icon={icon} />}
					<HeaderTitle>{room.name}</HeaderTitle>
					<HeaderState onClick={action('onClick')} icon='star' />
					<HeaderState icon='key' />
					<HeaderState icon='language' />
					<Box withTruncatedText>{room.topic}</Box>
				</HeaderContentRow>
			</HeaderContent>
			<HeaderToolbar>
				<HeaderToolbarAction icon='magnifier' action={action('action')} />
				<HeaderToolbarAction icon='key' action={action('action')} />
				<HeaderToolbarAction icon='kebab' action={action('action')} />
			</HeaderToolbar>
		</Header>
	</>
);

export const WithAnnouncement = () => (
	<>
		<Header>
			<HeaderAvatar>
				<CustomAvatar />
			</HeaderAvatar>
			<HeaderContent>
				<HeaderContentRow>
					{icon && <HeaderIcon icon={icon} />}
					<HeaderTitle>{room.name}</HeaderTitle>
					<HeaderState onClick={action('onClick')} icon='star' />
					<HeaderState icon='key' />
					<HeaderState icon='language' />
				</HeaderContentRow>
			</HeaderContent>
			<HeaderToolbar>
				<HeaderToolbarAction icon='magnifier' action={action('action')} />
				<HeaderToolbarAction icon='key' action={action('action')} />
				<HeaderToolbarAction icon='kebab' action={action('action')} />
			</HeaderToolbar>
		</Header>
		<AnnouncementBanner onClick={action('clicked')}>{room.announcement}</AnnouncementBanner>
	</>
);
