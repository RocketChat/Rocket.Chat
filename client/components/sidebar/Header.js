import React, { useMemo } from 'react';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { Sidebar } from '@rocket.chat/fuselage';

import { useUser } from '../../contexts/UserContext';
import Home from './headerActions/Home';
import Search from './headerActions/Search';
import Directory from './headerActions/Directory';
import Sort from './headerActions/Sort';
import CreateRoom from './headerActions/CreateRoom';
import Menu from './headerActions/Menu';
import UserAvatarButton from './UserAvatarButton';

const groupByName = (colors) => {
	const map = {};

	Object.entries(colors).reduce((map, [key, value]) => {
		const [group, ...id] = key;

		map[group] = map[group] || {};

		map[group][id.join('')] = value;
		return map;
	}, map);
	return map;
};


const COLOR_MAP = {
	b: 'blue',
	g: 'green',
	n: 'neutral',
	o: 'orange',
	p: 'purple',
	r: 'red',
	y: 'yellow',
};

const invertGroup = (colors) => {
	const keys = Object.keys(colors);
	const values = Object.values(colors).reverse();
	return Object.fromEntries(keys.map((_, i) => [keys[i], values[i]]));
};

const invert = (colors) => Object.entries(colors).reduce((result, [key, colors]) => {
	result[key] = invertGroup(colors);
	return result;
}, {});

const toCssVars = (colors, selector = ':root') => `${ selector } { ${ Object.entries(colors).map(([group, colors]) => Object.entries(colors).map(([id, value]) => `--rcx-color-${ COLOR_MAP[group] }-${ id }: ${ value };`).join('\n')).join('\n') }}`;


const HeaderWithData = () => {
	const user = useUser();

	return <>
		<style>
			{useMemo(() => toCssVars(invert(groupByName(colors)), '.sidebar'), [])}
			{`.sidebar {
				--rcx-button-colors-secondary-active-border-color: var(--rcx-color-neutral-100);
				--rcx-button-colors-secondary-active-background-color: var(--rcx-color-neutral-200);
				--rcx-button-colors-secondary-color: var(--rcx-color-neutral-400);
				--rcx-button-colors-secondary-border-color: var(--rcx-color-neutral-200);
				--rcx-button-colors-secondary-background-color: var(--rcx-color-neutral-200);
				--rcx-button-colors-secondary-hover-background-color: var(--rcx-color-neutral-100);
				--rcx-button-colors-secondary-hover-border-color: var(--rcx-color-neutral-100);
				--rcx-divider-color: rgba(31, 35, 41, 0.4);

				--rcx-sidebar-item-background-color-hover: var(--rcx-color-neutral-100);
				--rcx-sidebar-item-background-color-selected: rgba(108, 114, 122, .3);
			}`}
		</style>

		<Sidebar.TopBar.Section>
			<UserAvatarButton user={user}/>
			<Sidebar.TopBar.Actions>
				<Home />
				<Search />
				<Directory />
				<Sort />
				<CreateRoom />
				<Menu />
			</Sidebar.TopBar.Actions>
		</Sidebar.TopBar.Section>
	</>;
};


export default HeaderWithData;
