import React, { useMemo } from 'react';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { Avatar, Sidebar, ActionButton, Box } from '@rocket.chat/fuselage';

import { useTranslation } from '../contexts/TranslationContext';
import { useCall } from '../contexts/CallContext';


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

const VARIATIONS = {
	success: { primary: true, success: true },
	danger: { primary: true, danger: true },
	normal: { ghost: true },
};


export default () => {
	const t = useTranslation();

	const { calls } = useCall();

	if (!calls?.length) {
		return;
	}

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
			<Avatar size={Sidebar.TopBar.Avatar.size} url={'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z'} {...Avatar } />
			<Sidebar.TopBar.Actions>
				<Sidebar.TopBar.Action icon='home'/>
				<Sidebar.TopBar.Action icon='magnifier'/>
				<Sidebar.TopBar.Action icon='globe'/>
				<Sidebar.TopBar.Action icon='sort'/>
				<Sidebar.TopBar.Action icon='edit-rounded'/>
			</Sidebar.TopBar.Actions>
		</Sidebar.TopBar.Section>
		<Sidebar.TopBar.ToolBox>
			<Sidebar.TopBar.Title>Title</Sidebar.TopBar.Title>
			<Sidebar.TopBar.Actions>
				<Sidebar.TopBar.Action success icon='phone'/>
				<Sidebar.TopBar.Action icon='message-disabled'/>
			</Sidebar.TopBar.Actions>
		</Sidebar.TopBar.ToolBox>
		<Sidebar.Section.Title>{t('Calls')}</Sidebar.Section.Title>
		{calls.map((call, index) => (call.render ? call.render(call) : <Sidebar.Item clickable data-call-id={call.id} key={call.id || index}>
			<Sidebar.Item.Avatar>
				<Avatar size='x28' url={call.avatar}/>
			</Sidebar.Item.Avatar>
			<Sidebar.Item.Content>
				{ call.icon && <Sidebar.Item.Icon name={call.icon}/> }
				<Sidebar.Item.Title>{call.name}</Sidebar.Item.Title>
			</Sidebar.Item.Content>
			{call.actions && <Sidebar.Item.Container>
				<Sidebar.Item.Actions>
					{call.actions.map((action, index) =>
						<ActionButton {...VARIATIONS[action.variation]}
							key={index}
							disabled={action.disabled}
							onClick={action.callback}
							title={action.label}
							icon={action.icon}/>)}
				</Sidebar.Item.Actions>
			</Sidebar.Item.Container>}
		</Sidebar.Item>))}
		<Box mbe='x12'/>
	</>;
};
