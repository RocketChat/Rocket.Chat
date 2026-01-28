import { Box, MenuItemColumn, MenuItemContent, MenuItemIcon, MenuItemInput } from '@rocket.chat/fuselage'; // 1. Added Box import
import type { ComponentProps, MouseEvent, ReactNode } from 'react';

export type GenericMenuItemProps = {
	id: string;
	icon?: ComponentProps<typeof MenuItemIcon>['name'];
	iconColor?: ComponentProps<typeof MenuItemIcon>['color'];
	content?: ReactNode;
	addon?: ReactNode;
	onClick?: (e?: MouseEvent<HTMLElement>) => void;
	status?: ReactNode;
	disabled?: boolean;
	description?: ReactNode;
	gap?: boolean;
	tooltip?: string;
	variant?: string;
};

const GenericMenuItem = ({ icon, iconColor, content, addon, status, gap, tooltip }: GenericMenuItemProps) => (
    <>
        {gap && <MenuItemColumn />}
        {/* 2. Wrap the icon in a flexbox container */}
        {icon && (
            <Box display='flex' alignItems='center' justifyContent='center' width='x20'>
                <MenuItemIcon name={icon} color={iconColor} />
            </Box>
        )}
        {status && <MenuItemColumn>{status}</MenuItemColumn>}
        {content && <MenuItemContent title={tooltip}>{content}</MenuItemContent>}
        {addon && <MenuItemInput>{addon}</MenuItemInput>}
    </>
);

export default GenericMenuItem;