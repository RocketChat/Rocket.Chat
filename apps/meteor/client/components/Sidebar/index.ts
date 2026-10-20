import Content from './Content';
import Header from './Header';
import Sidebar from './Sidebar';
import GenericItem from './SidebarGenericItem';
import SidebarItemsAssembler from './SidebarItemsAssembler';
import NavigationItem from './SidebarNavigationItem';

export default Object.assign(Sidebar, {
	Content,
	Header,
	GenericItem,
	NavigationItem,
	ItemsAssembler: SidebarItemsAssembler,
});
