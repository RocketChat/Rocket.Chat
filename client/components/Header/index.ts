import Avatar from './Avatar';
import Button from './Button';
import Content from './Content';
import Header from './Header';
import HeaderDivider from './HeaderDivider';
import HeaderIcon from './HeaderIcon';
import Row from './Row';
import State from './State';
import Subtitle from './Subtitle';
import Title from './Title';
import ToolBox from './ToolBox';
import ToolBoxAction from './ToolBoxAction';
import ToolBoxActionBadge from './ToolBoxActionBadge';

export default Object.assign(Header, {
	Button,
	State,
	Avatar,
	Content: Object.assign(Content, {
		Row,
	}),
	Title,
	Subtitle,
	ToolBox,
	ToolBoxAction: Object.assign(ToolBoxAction, {
		Badge: ToolBoxActionBadge,
	}),
	Divider: HeaderDivider,
	Icon: HeaderIcon,
	Badge: ToolBoxActionBadge,
});
