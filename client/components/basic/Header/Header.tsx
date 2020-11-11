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

const Button = (props: any): JSX.Element => <Box mi='x4' display='flex' alignItems='center' {...props}/>;
const Avatar = (props: any): JSX.Element => <Button width='x36' {...props}/>;

const HeaderDivider = (): JSX.Element => <Divider mbs='neg-x2' mbe={0}/>;

const Header = (props: any): JSX.Element => <Box rcx-room-header is='header' height='x64' display='flex' justifyContent='center' flexDirection='column' overflow='hidden'>
	<Box mi='neg-x4' height='x64' pi='x24' display='flex' flexGrow={1} justifyContent='center' alignItems='center' overflow='hidden' flexDirection='row' {...props}/>
	<HeaderDivider/>
</Box>;
Header.ToolBoxAction = ToolBoxAction;
export default Header;

Object.assign(Content, {
	Row,
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
