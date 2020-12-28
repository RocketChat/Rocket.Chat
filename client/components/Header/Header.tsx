import React, { FC } from 'react';
import { Box, Icon, Divider, ButtonGroup, ActionButton, Badge, BadgeProps } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

const Title: FC = (props: any) => <Box color='default' mi='x4' fontScale='s2' withTruncatedText {...props}/>;
const Subtitle: FC = (props: any) => <Box color='hint' fontScale='p1' withTruncatedText {...props}/>;

const Row: FC = (props: any) => <Box alignItems='center' flexShrink={1} flexGrow={1} display='flex' {...props}/>;

const HeaderIcon: FC<{ icon: JSX.Element | { name: string; color?: string } | null}> = ({ icon }) => icon && <Box display='flex' flexShrink={0} alignItems='center' size={18} overflow='hidden' justifyContent='center'>{React.isValidElement(icon) ? icon : <Icon color='info' size='x18' { ...{ name: (icon as any).name }} />}</Box>;

const ToolBox: FC = (props: any) => <ButtonGroup mi='x4' medium {...props}/>;

const ToolBoxAction: FC = ({ id, icon, title, action, className, tabId, index, ...props }: any) => <ActionButton
	className={className}
	primary={tabId === id}
	onClick={action}
	title={title}
	data-toolbox={index}
	key={id}
	icon={icon}
	position='relative'
	ghost
	tiny
	overflow='visible'
	{...props}
/>;

const ToolBoxActionBadge: FC<BadgeProps> = (props) => <Box position='absolute' className={css`top: 0; right: 0; transform: translate(30%, -30%);`}><Badge {...props}/></Box>;

const State: FC = (props: any) => (props.onClick ? <ActionButton ghost mini {...props}/> : <Icon size={16} name={props.icon} {...props}/>);

const Content: FC = (props: any) => <Box flexGrow={1} width={1} flexShrink={1} mi='x4' display='flex' justifyContent='center' flexDirection='column' {...props}/>;

const Button: FC = (props: any) => <Box mi='x4' display='flex' alignItems='center' {...props}/>;
const Avatar: FC = (props: any) => <Button width='x36' {...props}/>;

const HeaderDivider: FC = () => <Divider { ...{ mbs: 'neg-x2', mbe: 0 } as any} />;

const Header: FC & { ToolBoxAction: FC; Badge: FC<BadgeProps> } = (props: any) => <Box rcx-room-header is='header' height='x64' display='flex' justifyContent='center' flexDirection='column' overflow='hidden' flexShrink={0}>
	<Box height='x64' mi='neg-x4' pi='x24' display='flex' flexGrow={1} justifyContent='center' alignItems='center' overflow='hidden' flexDirection='row' {...props}/>
	<HeaderDivider/>
</Box>;

Header.ToolBoxAction = ToolBoxAction;
Header.Badge = ToolBoxActionBadge;

export default Header;

Object.assign(Content, {
	Row,
});

Object.assign(ToolBoxAction, {
	Badge: ToolBoxActionBadge,
});

Object.assign(Header, {
	Button,
	State,
	Avatar,
	Content,
	Title,
	Subtitle,
	ToolBox,
	ToolBoxAction,
	Divider: HeaderDivider,
	Icon: HeaderIcon,
});
