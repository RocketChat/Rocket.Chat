import HeaderToolBox from './HeaderToolBox';
import Header from './Header';
import HeaderAvatar from './HeaderAvatar';
import HeaderButton from './HeaderButton';
import HeaderContent from './HeaderContent';
import HeaderContentRow from './HeaderContentRow';
import HeaderDivider from './HeaderDivider';
import HeaderIcon from './HeaderIcon';
import HeaderState from './HeaderState';
import HeaderSubtitle from './HeaderSubtitle';
import HeaderTitle from './HeaderTitle';
import HeaderToolBoxAction from './HeaderToolBoxAction';
import HeaderToolBoxActionBadge from './HeaderToolBoxActionBadge';

export default Object.assign(Header, {
	Button: HeaderButton,
	State: HeaderState,
	Avatar: HeaderAvatar,
	Content: Object.assign(HeaderContent, {
		Row: HeaderContentRow,
	}),
	Title: HeaderTitle,
	Subtitle: HeaderSubtitle,
	Divider: HeaderDivider,
	Icon: HeaderIcon,
	Badge: HeaderToolBoxActionBadge,
	ToolBox: Object.assign(HeaderToolBox, {
		Action: Object.assign(HeaderToolBoxAction, {
			Badge: HeaderToolBoxActionBadge,
		}),
	}),
	ToolBoxAction: Object.assign(HeaderToolBoxAction, {
		Badge: HeaderToolBoxActionBadge,
	}),
});
