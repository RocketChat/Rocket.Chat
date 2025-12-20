import type { IRoom } from '@rocket.chat/core-typings';
import { Avatar, Box, IconButton } from '@rocket.chat/fuselage';
import { SettingsContext } from '@rocket.chat/ui-contexts';
import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/react';
import type { ComponentPropsWithoutRef, ComponentType } from 'react';

import {
	Header,
	HeaderAvatar,
	HeaderContent,
	HeaderContentRow,
	HeaderIcon,
	HeaderToolbar,
	HeaderToolbarAction,
	HeaderToolbarActionBadge,
	HeaderTitle,
	HeaderState,
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

const CustomAvatar = (props: Omit<ComponentPropsWithoutRef<typeof Avatar>, 'url'>) => <Avatar size='x28' url={avatarUrl} {...props} />;
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
				<HeaderState onClick={action('click')} title='star' icon='star' />
				<HeaderState icon='key' />
				<HeaderState icon='language' />
			</HeaderContentRow>
		</HeaderContent>
		<HeaderToolbar>
			<HeaderToolbarAction title='magnifier' icon='magnifier' />
			<HeaderToolbarAction title='key' icon='key' />
			<HeaderToolbarAction title='menu' icon='kebab' />
		</HeaderToolbar>
	</Header>
);

export const WithBurger = () => (
	<Header>
		<HeaderToolbar>
			<IconButton title='burger' icon='burger' />
		</HeaderToolbar>
		<HeaderAvatar>
			<CustomAvatar />
		</HeaderAvatar>
		<HeaderContent>
			<HeaderContentRow>
				{icon && <HeaderIcon icon={icon} />}
				<HeaderTitle>{room.name}</HeaderTitle>
				<HeaderState onClick={action('onClick')} title='star' icon='star' />
				<HeaderState icon='key' />
				<HeaderState icon='language' />
			</HeaderContentRow>
		</HeaderContent>
		<HeaderToolbar>
			<HeaderToolbarAction title='magnifier' icon='magnifier' />
			<HeaderToolbarAction title='key' icon='key' />
			<HeaderToolbarAction title='menu' icon='kebab' />
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
				<HeaderState onClick={action('onClick')} title='star' icon='star' />
			</HeaderContentRow>
		</HeaderContent>
		<HeaderToolbar>
			<HeaderToolbarAction title='call' icon='phone'>
				<HeaderToolbarActionBadge variant='primary'>1</HeaderToolbarActionBadge>
			</HeaderToolbarAction>
			<HeaderToolbarAction title='disable' icon='phone'>
				<HeaderToolbarActionBadge variant='danger'>2</HeaderToolbarActionBadge>
			</HeaderToolbarAction>
			<HeaderToolbarAction title='decline' icon='phone'>
				<HeaderToolbarActionBadge variant='warning'>99</HeaderToolbarActionBadge>
			</HeaderToolbarAction>
			<HeaderToolbarAction title='menu' icon='kebab' />
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
					<HeaderState onClick={action('onClick')} title='star' icon='star' />
					<HeaderState icon='key' />
					<HeaderState icon='language' />
					<Box withTruncatedText>{room.topic}</Box>
				</HeaderContentRow>
			</HeaderContent>
			<HeaderToolbar>
				<HeaderToolbarAction title='magnifier' icon='magnifier' />
				<HeaderToolbarAction title='key' icon='key' />
				<HeaderToolbarAction title='menu' icon='kebab' />
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
					<HeaderState onClick={action('onClick')} title='star' icon='star' />
					<HeaderState icon='key' />
					<HeaderState icon='language' />
				</HeaderContentRow>
			</HeaderContent>
			<HeaderToolbar>
				<HeaderToolbarAction title='magnifier' icon='magnifier' />
				<HeaderToolbarAction title='key' icon='key' />
				<HeaderToolbarAction title='menu' icon='kebab' />
			</HeaderToolbar>
		</Header>
		<AnnouncementBanner onClick={action('clicked')}>{room.announcement}</AnnouncementBanner>
	</>
);
