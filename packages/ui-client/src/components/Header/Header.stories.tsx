import type { IRoom } from '@rocket.chat/core-typings';
import { Avatar } from '@rocket.chat/fuselage';
import { SettingsContext } from '@rocket.chat/ui-contexts';
import { action } from '@storybook/addon-actions';
import type { ComponentMeta } from '@storybook/react';
import React from 'react';

import Header from '.';

const avatarUrl =
	'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z';

export default {
	title: 'Components/Header',
	component: Header,
	subcomponents: {
		'Header.ToolBox': Header.ToolBox,
		'Header.ToolBox.Action': Header.ToolBox.Action,
		'Header.Avatar': Header.Avatar,
		'Header.Content': Header.Content,
		'Header.Content.Row': Header.Content.Row,
	},
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(fn) => (
			<SettingsContext.Provider
				value={{
					hasPrivateAccess: true,
					isLoading: false,
					querySetting: (_id) => [
						() => () => undefined,
						() => ({
							_id,
							type: 'action',
							value: '',
							public: true,
							blocked: false,
							createdAt: new Date(),
							env: true,
							i18nLabel: _id,
							packageValue: false,
							sorter: 1,
							ts: new Date(),
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
} as ComponentMeta<typeof Header>;

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
const icon = { name: 'hash' };

export const Default = () => {
	return (
		<Header>
			<Header.Avatar>{avatar}</Header.Avatar>
			<Header.Content>
				<Header.Content.Row>
					{icon && <Header.Icon icon={icon} />}
					<Header.Title>{room.name}</Header.Title>
					<Header.State onClick={action('onClick')} icon='star' />
					<Header.State icon='key' />
					<Header.State icon='language' />
				</Header.Content.Row>
				<Header.Content.Row>
					<Header.Subtitle>{room.name}</Header.Subtitle>
				</Header.Content.Row>
			</Header.Content>
			<Header.ToolBox>
				<Header.ToolBox.Action icon='magnifier' />
				<Header.ToolBox.Action icon='key' />
				<Header.ToolBox.Action icon='kebab' />
			</Header.ToolBox>
		</Header>
	);
};

export const WithBurger = () => {
	return (
		<Header>
			<Header.ToolBox>
				<Header.ToolBox.Action icon='burger' />
			</Header.ToolBox>
			<Header.Avatar>{avatar}</Header.Avatar>
			<Header.Content>
				<Header.Content.Row>
					{icon && <Header.Icon icon={icon} />}
					<Header.Title>{room.name}</Header.Title>
					<Header.State onClick={action('onClick')} icon='star' />
					<Header.State icon='key' />
					<Header.State icon='language' />
				</Header.Content.Row>
				<Header.Content.Row>
					<Header.Subtitle>{room.name}</Header.Subtitle>
				</Header.Content.Row>
			</Header.Content>
			<Header.ToolBox>
				<Header.ToolBox.Action icon='magnifier' />
				<Header.ToolBox.Action icon='key' />
				<Header.ToolBox.Action icon='kebab' />
			</Header.ToolBox>
		</Header>
	);
};

export const WithActionBadge = () => {
	return (
		<Header>
			<Header.Avatar>{avatar}</Header.Avatar>
			<Header.Content>
				<Header.Content.Row>
					{icon && <Header.Icon icon={icon} />}
					<Header.Title>{room.name}</Header.Title>
					<Header.State onClick={action('onClick')} icon='star' />
				</Header.Content.Row>
				<Header.Content.Row>
					<Header.Subtitle>{room.name}</Header.Subtitle>
				</Header.Content.Row>
			</Header.Content>
			<Header.ToolBox>
				<Header.ToolBox.Action icon='phone'>
					<Header.ToolBox.ActionBadge variant='primary'>1</Header.ToolBox.ActionBadge>
				</Header.ToolBox.Action>
				<Header.ToolBox.Action icon='phone'>
					<Header.ToolBox.ActionBadge variant='danger'>2</Header.ToolBox.ActionBadge>
				</Header.ToolBox.Action>
				<Header.ToolBox.Action icon='phone'>
					<Header.ToolBox.ActionBadge variant='warning'>99</Header.ToolBox.ActionBadge>
				</Header.ToolBox.Action>
				<Header.ToolBox.Action icon='kebab' />
			</Header.ToolBox>
		</Header>
	);
};
