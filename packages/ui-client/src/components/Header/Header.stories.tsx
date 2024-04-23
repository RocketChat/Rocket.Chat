import type { IRoom } from '@rocket.chat/core-typings';
import { Avatar, Box, IconButton } from '@rocket.chat/fuselage';
import { SettingsContext } from '@rocket.chat/ui-contexts';
import { action } from '@storybook/addon-actions';
import type { ComponentMeta } from '@storybook/react';
import { ComponentProps } from 'react';

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
	HeaderSection,
} from '.';

const avatarUrl =
	'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z';

export default {
	title: 'Components/Header',
	component: Header,
	subcomponents: {
		HeaderToolbar,
		HeaderToolbarAction,
		HeaderAvatar,
		HeaderContent,
		HeaderContentRow,
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

const CustomAvatar = (props: Omit<ComponentProps<typeof Avatar>, 'url'>) => <Avatar size='x28' url={avatarUrl} {...props} />;
const icon = { name: 'hash' } as const;

export const Default = () => (
	<Header>
		<HeaderSection>
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
				<HeaderToolbarAction icon='magnifier' />
				<HeaderToolbarAction icon='key' />
				<HeaderToolbarAction icon='kebab' />
			</HeaderToolbar>
		</HeaderSection>

		<HeaderSection>
			<HeaderContentRow>
				<HeaderSubtitle>{room.name}</HeaderSubtitle>
				<Box display='flex' mis='x24' flexShrink={0} alignItems='center'>
					<CustomAvatar size='x18' />
					<Box fontScale='p2' color='secondary-info' mi='x4'>
						Will Bell
					</Box>
					<IconButton icon='message' small />
				</Box>
			</HeaderContentRow>
		</HeaderSection>
	</Header>
);

export const WithBurger = () => (
	<Header>
		<HeaderSection>
			<HeaderToolbar>
				<HeaderToolbarAction icon='burger' />
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
				<HeaderToolbarAction icon='magnifier' />
				<HeaderToolbarAction icon='key' />
				<HeaderToolbarAction icon='kebab' />
			</HeaderToolbar>
		</HeaderSection>
		<HeaderSection>
			<HeaderContentRow>
				<HeaderSubtitle>{room.name}</HeaderSubtitle>
			</HeaderContentRow>
		</HeaderSection>
	</Header>
);

export const WithActionBadge = () => (
	<Header>
		<HeaderSection>
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
		</HeaderSection>
		<HeaderSection>
			<HeaderContentRow>
				<HeaderSubtitle>{room.name}</HeaderSubtitle>
			</HeaderContentRow>
		</HeaderSection>
	</Header>
);
