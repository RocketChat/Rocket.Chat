import React, { memo, useContext } from 'react';
import { BoxProps, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import Header from '../../../../components/Header';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { QuickActionsActionConfig } from '../../lib/QuickActions';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useTab, useTabBarOpen } from '../../providers/ToolboxProvider';
import { QuickActionsContext } from '../../lib/QuickActions/QuickActionsContext';


const QuickActions = ({ className }: { className: BoxProps['className'] }): JSX.Element => {
	const tab = useTab();
	const openTabBar = useTabBarOpen();
	const { isMobile } = useLayout();
	const t = useTranslation();
	const { actions: mapActions } = useContext(QuickActionsContext);
	const actions = (Array.from(mapActions.values()) as QuickActionsActionConfig[]).sort((a, b) => (a.order || 0) - (b.order || 0));
	const visibleActions = isMobile ? [] : actions.slice(0, 6);

	console.log(actions);

	const actionDefault = useMutableCallback((e) => {
		const index = e.currentTarget.getAttribute('data-toolbox');
		openTabBar(actions[index].id);
	});

	return <ButtonGroup mi='x4' medium>
		{ visibleActions.map(({ renderAction, id, color, icon, title, action = actionDefault }, index) => {
			const props = {
				id,
				icon,
				color,
				title: t(title),
				className,
				tabId: id,
				index,
				primary: id === tab?.id,
				'data-quick-actions': index,
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
