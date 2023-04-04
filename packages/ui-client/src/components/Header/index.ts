import Header from './Header';
import HeaderAvatar from './HeaderAvatar';
import HeaderContent from './HeaderContent';
import HeaderContentRow from './HeaderContentRow';
import HeaderDivider from './HeaderDivider';
import HeaderIcon from './HeaderIcon';
import HeaderLink from './HeaderLink';
import HeaderState from './HeaderState';
import HeaderSubtitle from './HeaderSubtitle';
import HeaderTag from './HeaderTag';
import HeaderTagIcon from './HeaderTagIcon';
import HeaderTagSkeleton from './HeaderTagSkeleton';
import HeaderTitle from './HeaderTitle';
import ToolBox from './ToolBox';

export default Object.assign(Header, {
	State: HeaderState,
	Avatar: HeaderAvatar,
	Content: Object.assign(HeaderContent, {
		Row: HeaderContentRow,
	}),
	Title: HeaderTitle,
	Subtitle: HeaderSubtitle,
	Divider: HeaderDivider,
	Icon: HeaderIcon,
	Link: HeaderLink,
	ToolBox: Object.assign(ToolBox, {
		Action: ToolBox.Action,
		ActionBadge: ToolBox.ActionBadge,
	}),
	Tag: Object.assign(HeaderTag, {
		Icon: HeaderTagIcon,
		Skeleton: HeaderTagSkeleton,
	}),
});
