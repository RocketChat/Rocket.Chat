import VerticalBar from './VerticalBar';
import VerticalBarAction from './VerticalBarAction';
import VerticalBarActionBack from './VerticalBarActionBack';
import VerticalBarActions from './VerticalBarActions';
import VerticalBarButton from './VerticalBarButton';
import VerticalBarClose from './VerticalBarClose';
import VerticalBarContent from './VerticalBarContent';
import VerticalBarFooter from './VerticalBarFooter';
import VerticalBarHeader from './VerticalBarHeader';
import VerticalBarIcon from './VerticalBarIcon';
import VerticalBarInnerContent from './VerticalBarInnerContent';
import VerticalBarScrollableContent from './VerticalBarScrollableContent';
import VerticalBarSkeleton from './VerticalBarSkeleton';
import VerticalBarText from './VerticalBarText';

export default Object.assign(VerticalBar, {
	InnerContent: VerticalBarInnerContent,
	Icon: VerticalBarIcon,
	Footer: VerticalBarFooter,
	Text: VerticalBarText,
	Action: VerticalBarAction,
	Actions: VerticalBarActions,
	Header: VerticalBarHeader,
	Close: VerticalBarClose,
	Content: VerticalBarContent,
	ScrollableContent: VerticalBarScrollableContent,
	Skeleton: VerticalBarSkeleton,
	Button: VerticalBarButton,
	Back: VerticalBarActionBack,
});
