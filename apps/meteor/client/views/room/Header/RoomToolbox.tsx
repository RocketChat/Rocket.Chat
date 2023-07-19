import { Menu, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { HeaderToolboxAction, HeaderToolboxDivider } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useLayout, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactNode, ReactElement, ComponentProps } from 'react';
import React, { memo, useContext, useRef } from 'react';

import { ToolboxContext, useTab, useTabBarOpen } from '../contexts/ToolboxContext';
import type { ToolboxAction } from '../lib/Toolbox';

type OptionRendererProps = ComponentProps<typeof Option>;

export type OptionRenderer = (props: OptionRendererProps) => ReactNode;

const renderMenuOption: OptionRenderer = ({ label: { title, icon }, ...props }: any) => (
	<Option label={title} icon={icon} data-qa-id={`ToolBoxAction-${icon}`} gap={!icon} {...props} />
);

type RoomToolboxProps = {
	className?: string;
};

const RoomToolbox = ({ className }: RoomToolboxProps): ReactElement => {
	const t = useTranslation();
	const tab = useTab();
	const openTabBar = useTabBarOpen();
	const { isMobile } = useLayout();
	const hiddenActionRenderers = useRef<{ [key: string]: OptionRenderer }>({});

	const { actions: mapActions } = useContext(ToolboxContext);
	const actions = Array.from(mapActions.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

	const featuredActions = actions.filter((action) => action.featured);
	const filteredActions = actions.filter((action) => !action.featured);
	const visibleActions = isMobile ? [] : filteredActions.slice(0, 6);

	const hiddenActions: Record<string, ToolboxAction> = Object.fromEntries(
		(isMobile ? actions : filteredActions.slice(6))
			.filter((item) => !item.disabled)
			.map((item) => {
				hiddenActionRenderers.current = {
					...hiddenActionRenderers.current,
					[item.id]: renderMenuOption,
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

	const defaultAction = useMutableCallback((actionId) => {
		openTabBar(actionId);
	});

	return (
		<>
			{featuredActions.map(({ renderAction, id, icon, title, action = defaultAction, disabled, tooltip }, index) => {
				const props = {
					id,
					icon,
					title: t(title),
					className,
					index,
					pressed: id === tab?.id,
					action,
					disabled,
					...(tooltip && { 'data-tooltip': t(tooltip as TranslationKey) }),
				};

				return renderAction?.(props) ?? <HeaderToolboxAction {...props} key={id} />;
			})}
			{featuredActions.length > 0 && <HeaderToolboxDivider />}
			{visibleActions.map(({ renderAction, id, icon, title, action = defaultAction, disabled, tooltip }, index) => {
				const props = {
					id,
					icon,
					title: t(title),
					className,
					index,
					pressed: id === tab?.id,
					action,
					disabled,
					...(tooltip && { 'data-tooltip': t(tooltip as TranslationKey) }),
				};

				return renderAction?.(props) ?? <HeaderToolboxAction {...props} key={id} />;
			})}
			{(filteredActions.length > 6 || isMobile) && (
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

export default memo(RoomToolbox);
