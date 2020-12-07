import React, { memo, useContext, useEffect } from 'react';
import { Menu, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import tinykeys from 'tinykeys';

// used to open the menu option by keyboard

import Header from '../../../../components/Header';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useTab, useTabBarOpen } from '../../providers/ToolboxProvider';
import { ToolboxContext } from '../../lib/Toolbox/ToolboxContext';
import { ToolboxActionConfig } from '../../lib/Toolbox';

const ToolBox = ({ className }): JSX.Element => {
	const tab = useTab();
	const openTabBar = useTabBarOpen();
	const { isMobile } = useLayout();
	const t = useTranslation();
	const { actions: mapActions } = useContext(ToolboxContext);
	const actions = (Array.from(mapActions.values()) as ToolboxActionConfig[]).sort((a, b) => (a.order || 0) - (b.order || 0));
	const visibleActions = isMobile ? [] : actions.slice(0, 6);
	const hiddenActions = Object.fromEntries((isMobile ? actions : actions.slice(6)).map((item) => [item.id, {
		label: { label: item.title, icon: item.icon },
		// ...item,
		action: (): void => {
			openTabBar(item.id);
		},
	}]));

	const actionDefault = useMutableCallback((e) => {
		const index = e.currentTarget.getAttribute('data-toolbox');
		openTabBar(actions[index].id);
	});

	const open = useMutableCallback((index) => {
		openTabBar(actions[index].id);
	});

	useEffect(() => {
		if (!visibleActions.length) {
			return;
		}
		const unsubscribe = tinykeys(window, Object.fromEntries(new Array(visibleActions.length).fill(true).map((_, index) => [`$mod+${ index + 1 }`, (): void => { open(index); }])));

		return (): void => {
			unsubscribe();
		};
	}, [visibleActions.length, open]);


	return <>
		{ visibleActions.map(({ id, icon, title, action = actionDefault }, index) => <Header.ToolBoxAction className={className} primary={id === tab?.id} data-toolbox={index} onClick={action} title={t(title)} key={id} icon={icon}/>)}
		{ actions.length > 6 && <Menu
			small={!isMobile}
			className={className}
			aria-keyshortcuts='alt'
			tabIndex={-1}
			options={hiddenActions}
			renderItem={({ label: { label, icon }, ...props }: { label: any }): JSX.Element => <Option label={t(label)} title={t(label)} icon={icon} {...props}/>}
		/>}
	</>;
};

export default memo(ToolBox);
