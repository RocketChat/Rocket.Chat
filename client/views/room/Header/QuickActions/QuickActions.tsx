import React, { memo, useContext, ReactNode, useRef } from 'react';
import { Option, BoxProps, MenuProps, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
// import tinykeys from 'tinykeys';

// used to open the menu option by keyboard
import Header from '../../../../components/Header';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { ToolboxActionConfig, OptionRenderer } from '../../lib/Toolbox';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useTab, useTabBarOpen } from '../../providers/ToolboxProvider';
import { QuickActionsContext } from '../../lib/QuickActions/QuickActionsContext';

const renderMenuOption: OptionRenderer = (
	{ label: { title, icon }, ...props }: any,
): ReactNode =>
	<Option label={title} icon={icon} {...props}/>;

const QuickActions = ({ className }: { className: BoxProps['className'] }): JSX.Element => {
	const tab = useTab();
	const openTabBar = useTabBarOpen();
	const { isMobile } = useLayout();
	const t = useTranslation();
	const hiddenActionRenderers = useRef<{[key: string]: OptionRenderer}>({});
	const { actions: mapActions } = useContext(QuickActionsContext);
	// console.log(className, mapActions);
	const actions = (Array.from(mapActions.values()) as ToolboxActionConfig[]).sort((a, b) => (a.order || 0) - (b.order || 0));
	const visibleActions = isMobile ? [] : actions.slice(0, 6);


	const hiddenActions: MenuProps['options'] = Object.fromEntries((isMobile ? actions : actions.slice(6)).map((item) => {
		hiddenActionRenderers.current = { ...hiddenActionRenderers.current, [item.id]: item.renderOption || renderMenuOption };
		return [item.id, {
			label: { title: t(item.title), icon: item.icon },
			action: (): void => {
				openTabBar(item.id);
			},
			...item,
		}];
	}));

	console.log(hiddenActions);

	const actionDefault = useMutableCallback((e) => {
		const index = e.currentTarget.getAttribute('data-toolbox');
		openTabBar(actions[index].id);
	});

	return <ButtonGroup mi='x4' medium>
		{ visibleActions.map(({ renderAction, id, icon, title, action = actionDefault }, index) => {
			const props = {
				id,
				icon,
				title: t(title),
				className,
				tabId: id,
				index,
				primary: id === tab?.id,
				'data-toolbox': index,
				action,
				key: id,
			};

			if (renderAction) {
				return renderAction(props);
			}
			return <Header.ToolBoxAction {...props} />;
		})}
		{/* { actions.length > 6 && <Menu
			tiny={!isMobile}
			title={t('Options')}
			maxHeight='initial'
			className={className}
			aria-keyshortcuts='alt'
			tabIndex={-1}
			options={hiddenActions}
			renderItem={({ value, ...props }): ReactNode => hiddenActionRenderers.current[value](props)}
		/>} */}
	</ButtonGroup>;
};

export default memo(QuickActions);
