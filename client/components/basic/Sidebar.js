import React, { useMemo } from 'react';
import { css } from '@rocket.chat/css-in-js';
import { Box, Scrollable, Icon } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useRoutePath } from '../../contexts/RouterContext';
import { ActionButton } from './Buttons/ActionButton';

const Sidebar = ({ children, ...props }) => <Box display='flex' flexDirection='column' h='100vh' {...props}>
	{children}
</Box>;

const Content = ({ children, ...props }) => <Scrollable {...props}>
	<Box display='flex' flexDirection='column' h='full'>
		{children}
	</Box>
</Scrollable>;

const Header = ({ title, onClose, children = undefined, ...props }) => <Box is='header' display='flex' flexDirection='column' pb='x16' {...props}>
	{(title || onClose) && <Box display='flex' flexDirection='row' alignItems='center' pi='x24' justifyContent='space-between' flexGrow={1}>
		{title && <Box color='neutral-800' fontSize='p1' fontWeight='p1' flexShrink={1} withTruncatedText>{title}</Box>}
		{onClose && <ActionButton icon='cross' onClick={onClose}/>}
	</Box>}
	{children}
</Box>;

const GenericItem = ({ href, active, children, ...props }) => <Box
	is='a'
	color='default'
	pb='x8'
	pi='x24'
	href={href}
	className={[
		active && 'active',
		css`
				&:hover,
				&:focus,
				&.active:focus,
				&.active:hover {
					background-color: var(--sidebar-background-light-hover);
				}

				&.active {
					background-color: var(--sidebar-background-light-active);
				}
			`,
	].filter(Boolean)}
	{...props}
>
	<Box
		mi='neg-x4'
		display='flex'
		flexDirection='row'
		alignItems='center'>
		{children}
	</Box>
</Box>;

const NavigationItem = ({ permissionGranted, pathGroup, pathSection, icon, label, currentPath }) => {
	const params = useMemo(() => ({ group: pathGroup }), [pathGroup]);
	const path = useRoutePath(pathSection, params);
	const isActive = path === currentPath || false;
	if (permissionGranted && !permissionGranted()) { return null; }
	return <Sidebar.GenericItem active={isActive} href={path} key={path}>
		{icon && <Icon name={icon} size='x20' mi='x4'/>}
		<Box withTruncatedText fontScale='p1' mi='x4' color='info'>{label}</Box>
	</Sidebar.GenericItem>;
};

const ItemsAssembler = ({ items, currentPath }) => {
	const t = useTranslation();
	return items.map(({
		href,
		pathSection,
		i18nLabel,
		name,
		icon,
		permissionGranted,
		pathGroup,
	}) => <Sidebar.NavigationItem
		permissionGranted={permissionGranted}
		pathGroup={pathGroup}
		pathSection={href || pathSection}
		icon={icon}
		label={t(i18nLabel || name)}
		key={i18nLabel || name}
		currentPath={currentPath}
	/>);
};

Sidebar.Content = Content;
Sidebar.Header = Header;
Sidebar.GenericItem = React.memo(GenericItem);
Sidebar.NavigationItem = React.memo(NavigationItem);
Sidebar.ItemsAssembler = React.memo(ItemsAssembler);

export default Sidebar;
