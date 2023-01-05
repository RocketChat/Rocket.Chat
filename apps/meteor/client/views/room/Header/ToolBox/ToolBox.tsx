import type { IRoom } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import { Menu, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Header } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useLayout, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactNode, ComponentProps, ReactElement } from 'react';
import React, { memo, useRef } from 'react';

// used to open the menu option by keyboard
import { useToolboxContext, useTab, useTabBarOpen } from '../../contexts/ToolboxContext';
import type { ToolboxActionConfig, OptionRenderer } from '../../lib/Toolbox';

const renderMenuOption: OptionRenderer = ({ label: { title, icon }, ...props }: any): ReactNode => (
	<Option label={title} icon={icon} data-qa-id={`ToolBoxAction-${icon}`} {...props} />
);

type ToolBoxProps = {
	className?: ComponentProps<typeof Box>['className'];
	room?: IRoom;
};

const ToolBox = ({ className }: ToolBoxProps): ReactElement => {
	const t = useTranslation();
	const tab = useTab();
	const openTabBar = useTabBarOpen();
	const { isMobile } = useLayout();
	const hiddenActionRenderers = useRef<{ [key: string]: OptionRenderer }>({});

	const { actions: mapActions } = useToolboxContext();

	const actions = (Array.from(mapActions.values()) as ToolboxActionConfig[]).sort((a, b) => (a.order || 0) - (b.order || 0));
	const featuredActions = actions.filter((action) => action.featured);
	const filteredActions = actions.filter((action) => !action.featured);
	const visibleActions = isMobile ? [] : filteredActions.slice(0, 6);

	const hiddenActions: Record<string, ToolboxActionConfig> = Object.fromEntries(
		(isMobile ? actions : filteredActions.slice(6))
			.filter((item) => !item.disabled)
			.map((item) => {
				hiddenActionRenderers.current = {
					...hiddenActionRenderers.current,
					[item.id]: item.renderOption || renderMenuOption,
				};
				return [
					item.id,
					{
						label: { title: t(item.title), icon: item.icon },
						action: (): void => {
							openTabBar(item.id);
						},
						...item,
					},
				];
			}),
	);

	const actionDefault = useMutableCallback((actionId) => {
		openTabBar(actionId);
	});

	// const open = useMutableCallback((index) => {
	// 	openTabBar(actions[index].id);
	// });

	// useEffect(() => {
	// 	if (!visibleActions.length) {
	// 		return;
	// 	}
	// 	const unsubscribe = tinykeys(window, Object.fromEntries(new Array(visibleActions.length).fill(true).map((_, index) => [`$mod+${ index + 1 }`, (): void => { open(index); }])));

	// 	return (): void => {
	// 		unsubscribe();
	// 	};
	// }, [visibleActions.length, open]);

	// TODO: Create helper for render Actions
	// TODO: Add proper Vertical Divider Component

	return (
		<>
			{featuredActions.map(({ renderAction, id, icon, title, action = actionDefault, disabled, 'data-tooltip': tooltip }, index) => {
				const props = {
					id,
					icon,
					title: t(title),
					className,
					index,
					info: id === tab?.id,
					action,
					key: id,
					disabled,
					...(tooltip ? { 'data-tooltip': t(tooltip as TranslationKey) } : {}),
				};
				if (renderAction) {
					return renderAction(props);
				}
				return <Header.ToolBox.Action {...props} />;
			})}
			{featuredActions.length > 0 && <Header.ToolBox.Divider />}
			{visibleActions.map(({ renderAction, id, icon, title, action = actionDefault, disabled, 'data-tooltip': tooltip }, index) => {
				const props = {
					id,
					icon,
					title: t(title),
					className,
					index,
					info: id === tab?.id,
					action,
					key: id,
					disabled,
					...(tooltip ? { 'data-tooltip': t(tooltip as TranslationKey) } : {}),
				};
				if (renderAction) {
					return renderAction(props);
				}
				return <Header.ToolBox.Action {...props} />;
			})}
			{filteredActions.length > 6 && (
				<Menu
					data-qa-id='ToolBox-Menu'
					tiny={!isMobile}
					title={t('Options')}
					maxHeight='initial'
					className={className}
					aria-keyshortcuts='alt'
					tabIndex={-1}
					options={hiddenActions}
					renderItem={({ value, ...props }): ReactElement | null => value && (hiddenActionRenderers.current[value](props) as ReactElement)}
				/>
			)}
		</>
	);
};

export default memo(ToolBox);
