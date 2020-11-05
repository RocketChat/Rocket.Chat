import React from 'react';
import { Box, Icon, Divider, ButtonGroup, ActionButton } from '@rocket.chat/fuselage';

const Title = (props: any): JSX.Element => <Box color='default' mi='x4' fontScale='s2' withTruncatedText {...props}/>;
const Subtitle = (props: any): JSX.Element => <Box color='hint' fontScale='p1' withTruncatedText {...props}/>;

const Row = (props: any): JSX.Element => <Box alignItems='center' flexShrink={1} flexGrow={1} display='flex' {...props}/>;

const HeaderIcon = ({ icon }: { icon: JSX.Element | { name: string; color?: string } | null}): JSX.Element | null => icon && <Box display='flex' flexShrink={0} alignItems='center' size={18} overflow='hidden' justifyContent='center'>{React.isValidElement(icon) ? icon : <Icon size='x18' { ...{ name: (icon as any).name }} />}</Box>;

const ToolBox = (props: any): JSX.Element => <ButtonGroup small {...props}/>;

const ToolBoxAction = (props: any): JSX.Element => <ActionButton ghost small {...props}/>;

const State = (props: any): JSX.Element => (props.onClick ? <ActionButton ghost mini {...props}/> : <Icon size={16} name={props.icon} {...props}/>);

const Content = (props: any): JSX.Element => <Box flexGrow={1} width={1} flexShrink={1} mi='x4' display='flex' justifyContent='center' flexDirection='column' {...props}/>;

const Avatar = (props: any): JSX.Element => <Box mi='x4' display='flex' alignItems='center' {...props}/>;

const HeaderDivider = (): JSX.Element => <Divider/>;

const Header = (props: any): JSX.Element => <Box rcx-room-header is='header' justifyContent='center' flexDirection='row'>
	<Box mbe='neg-x8' mi='neg-x4' height='x64' pi='x24' pb='x16' display='flex' justifyContent='center' overflow='hidden' flexDirection='row' {...props}/>
	<HeaderDivider/>
</Box>;

export default Header;

Object.assign(Content, {
	Row,
});

Object.assign(Header, {
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
