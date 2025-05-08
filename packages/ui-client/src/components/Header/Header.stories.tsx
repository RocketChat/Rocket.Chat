import type { IRoom } from '@rocket.chat/core-typings';
import { Avatar } from '@rocket.chat/fuselage';
import { SettingsContext } from '@rocket.chat/ui-contexts';
import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/react';
import { ComponentType } from 'react';

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
	HeaderSubtitle,
} from '.';

const avatarUrl =
	'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z';

export default {
	title: 'Components/Header',
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

const avatar = <Avatar size='x40' url={avatarUrl} />;
const icon = { name: 'hash' } as const;

export const Default = () => (
	<Header>
		<HeaderAvatar>{avatar}</HeaderAvatar>
		<HeaderContent>
			<HeaderContentRow>
				{icon && <HeaderIcon icon={icon} />}
				<HeaderTitle>{room.name}</HeaderTitle>
				<HeaderState onClick={action('onClick')} icon='star' />
				<HeaderState icon='key' />
				<HeaderState icon='language' />
			</HeaderContentRow>
			<HeaderContentRow>
				<HeaderSubtitle>{room.name}</HeaderSubtitle>
			</HeaderContentRow>
		</HeaderContent>
		<HeaderToolbar>
			<HeaderToolbarAction icon='magnifier' />
			<HeaderToolbarAction icon='key' />
			<HeaderToolbarAction icon='kebab' />
		</HeaderToolbar>
	</Header>
);

export const WithBurger = () => (
	<Header>
		<HeaderToolbar>
			<HeaderToolbarAction icon='burger' />
		</HeaderToolbar>
		<HeaderAvatar>{avatar}</HeaderAvatar>
		<HeaderContent>
			<HeaderContentRow>
				{icon && <HeaderIcon icon={icon} />}
				<HeaderTitle>{room.name}</HeaderTitle>
				<HeaderState onClick={action('onClick')} icon='star' />
				<HeaderState icon='key' />
				<HeaderState icon='language' />
			</HeaderContentRow>
			<HeaderContentRow>
				<HeaderSubtitle>{room.name}</HeaderSubtitle>
			</HeaderContentRow>
		</HeaderContent>
		<HeaderToolbar>
			<HeaderToolbarAction icon='magnifier' />
			<HeaderToolbarAction icon='key' />
			<HeaderToolbarAction icon='kebab' />
		</HeaderToolbar>
	</Header>
);

export const WithActionBadge = () => (
	<Header>
		<HeaderAvatar>{avatar}</HeaderAvatar>
		<HeaderContent>
			<HeaderContentRow>
				{icon && <HeaderIcon icon={icon} />}
				<HeaderTitle>{room.name}</HeaderTitle>
				<HeaderState onClick={action('onClick')} icon='star' />
			</HeaderContentRow>
			<HeaderContentRow>
				<HeaderSubtitle>{room.name}</HeaderSubtitle>
			</HeaderContentRow>
		</HeaderContent>
		<HeaderToolbar>
			<HeaderToolbarAction icon='phone'>
				<HeaderToolbarActionBadge variant='primary'>1</HeaderToolbarActionBadge>
			</HeaderToolbarAction>
			<HeaderToolbarAction icon='phone'>
				<HeaderToolbarActionBadge variant='danger'>2</HeaderToolbarActionBadge>
			</HeaderToolbarAction>
			<HeaderToolbarAction icon='phone'>
				<HeaderToolbarActionBadge variant='warning'>99</HeaderToolbarActionBadge>
			</HeaderToolbarAction>
			<HeaderToolbarAction icon='kebab' />
		</HeaderToolbar>
	</Header>
);
