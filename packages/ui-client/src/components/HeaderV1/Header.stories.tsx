import type { IRoom } from '@rocket.chat/core-typings';
import { Avatar, IconButton } from '@rocket.chat/fuselage';
import { SettingsContext } from '@rocket.chat/ui-contexts';
import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/react';

import {
	HeaderV1,
	HeaderV1Avatar,
	HeaderV1Content,
	HeaderV1ContentRow,
	HeaderV1Icon,
	HeaderV1Toolbar,
	HeaderV1ToolbarAction,
	HeaderV1ToolbarActionBadge,
	HeaderV1Title,
	HeaderV1State,
	HeaderV1Subtitle,
} from '.';

const avatarUrl =
	'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z';

export default {
	title: 'Components/Header',
	component: HeaderV1,
	subcomponents: {
		HeaderV1Avatar,
		HeaderV1Content,
		HeaderV1ContentRow,
		HeaderV1Icon,
		HeaderV1Toolbar,
		HeaderV1ToolbarAction,
		HeaderV1ToolbarActionBadge,
		HeaderV1Title,
		HeaderV1State,
		HeaderV1Subtitle,
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
} satisfies Meta<typeof HeaderV1>;

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
	<HeaderV1>
		<HeaderV1Avatar>{avatar}</HeaderV1Avatar>
		<HeaderV1Content>
			<HeaderV1ContentRow>
				{icon && <HeaderV1Icon icon={icon} />}
				<HeaderV1Title>{room.name}</HeaderV1Title>
				<HeaderV1State onClick={action('onClick')} icon='star' title='start' />
				<HeaderV1State icon='key' />
				<HeaderV1State icon='language' />
			</HeaderV1ContentRow>
			<HeaderV1ContentRow>
				<HeaderV1Subtitle>{room.name}</HeaderV1Subtitle>
			</HeaderV1ContentRow>
		</HeaderV1Content>
		<HeaderV1Toolbar>
			<HeaderV1ToolbarAction title='magnifier' icon='magnifier' />
			<HeaderV1ToolbarAction title='key' icon='key' />
			<HeaderV1ToolbarAction title='menu' icon='kebab' />
		</HeaderV1Toolbar>
	</HeaderV1>
);

export const WithBurger = () => (
	<HeaderV1>
		<HeaderV1Toolbar>
			<IconButton title='burger' icon='burger' />
		</HeaderV1Toolbar>
		<HeaderV1Avatar>{avatar}</HeaderV1Avatar>
		<HeaderV1Content>
			<HeaderV1ContentRow>
				{icon && <HeaderV1Icon icon={icon} />}
				<HeaderV1Title>{room.name}</HeaderV1Title>
				<HeaderV1State onClick={action('onClick')} title='star' icon='star' />
				<HeaderV1State icon='key' />
				<HeaderV1State icon='language' />
			</HeaderV1ContentRow>
			<HeaderV1ContentRow>
				<HeaderV1Subtitle>{room.name}</HeaderV1Subtitle>
			</HeaderV1ContentRow>
		</HeaderV1Content>
		<HeaderV1Toolbar>
			<HeaderV1ToolbarAction title='magnifier' icon='magnifier' />
			<HeaderV1ToolbarAction title='key' icon='key' />
			<HeaderV1ToolbarAction title='menu' icon='kebab' />
		</HeaderV1Toolbar>
	</HeaderV1>
);

export const WithActionBadge = () => (
	<HeaderV1>
		<HeaderV1Avatar>{avatar}</HeaderV1Avatar>
		<HeaderV1Content>
			<HeaderV1ContentRow>
				{icon && <HeaderV1Icon icon={icon} />}
				<HeaderV1Title>{room.name}</HeaderV1Title>
				<HeaderV1State onClick={action('onClick')} title='favorite' icon='star' />
			</HeaderV1ContentRow>
			<HeaderV1ContentRow>
				<HeaderV1Subtitle>{room.name}</HeaderV1Subtitle>
			</HeaderV1ContentRow>
		</HeaderV1Content>
		<HeaderV1Toolbar>
			<HeaderV1ToolbarAction title='call' icon='phone'>
				<HeaderV1ToolbarActionBadge variant='primary'>1</HeaderV1ToolbarActionBadge>
			</HeaderV1ToolbarAction>
			<HeaderV1ToolbarAction title='disable' icon='phone'>
				<HeaderV1ToolbarActionBadge variant='danger'>2</HeaderV1ToolbarActionBadge>
			</HeaderV1ToolbarAction>
			<HeaderV1ToolbarAction title='decline' icon='phone'>
				<HeaderV1ToolbarActionBadge variant='warning'>99</HeaderV1ToolbarActionBadge>
			</HeaderV1ToolbarAction>
			<HeaderV1ToolbarAction title='menu' icon='kebab' />
		</HeaderV1Toolbar>
	</HeaderV1>
);
