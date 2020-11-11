import React, { memo, useCallback, useContext, useEffect } from 'react';
import { Menu, Option } from '@rocket.chat/fuselage';
import { useMediaQuery, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import tinykeys from 'tinykeys';

// used to open the menu option by keyboard

import Header from '../../../components/basic/Header';
import { ToolboxContext } from '../../lib/Toolbox/ToolboxContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { ToolboxActionConfig } from '../../lib/Toolbox';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { useLayout } from '../../../contexts/LayoutContext';

const ToolBox = (): JSX.Element => {
	const { isMobile } = useLayout();
	const t = useTranslation();
	const { actions: mapActions, tabBar } = useContext(ToolboxContext);
	const actions = (Array.from(mapActions.values()) as ToolboxActionConfig[]).sort((a, b) => (a.order || 0) - (b.order || 0));
	const visibleActions = isMobile ? [] : actions.slice(0, 6);
	const hiddenActions = Object.fromEntries((isMobile ? actions : actions.slice(6)).map((item) => [item.id, {
		label: { label: item.title, icon: item.icon },
		// ...item,
		action: (): void => {
			tabBar.open(item);
		},
	}]));

	const actionDefault = useMutableCallback((e) => {
		const index = e.currentTarget.getAttribute('data-toolbox');
		tabBar.open(actions[index]);
	});

	const open = useMutableCallback((index) => {
		tabBar.open(actions[index]);
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

	const enabled = useReactiveValue(useCallback(() => tabBar.getId(), [tabBar]));

	return <>
		{ visibleActions.map(({ id, icon, title, action = actionDefault }, index) => <Header.ToolBoxAction primary={id === enabled} data-toolbox={index} onClick={action} title={t(title)} key={id} icon={icon}/>)}
		{ actions.length > 6 && <Menu
			small={!isMobile}
			aria-keyshortcuts='alt'
			tabIndex={-1}
			options={hiddenActions}
			renderItem={({ label: { label, icon }, ...props }: { label: any }): JSX.Element => <Option label={t(label)} title={t(label)} icon={icon} {...props}/>}
		/>}
	</>;
};

export default memo(ToolBox);
