import Content from './Content';
import Header from './Header';
import ListItem from './ListItem';
import Sidebar from './Sidebar';
import GenericItem from './SidebarGenericItem';
import SidebarItemsAssembler from './SidebarItemsAssembler';
import NavigationItem from './SidebarNavigationItem';

export * from './Content';
export * from './Header';
export * from './ListItem';
export * from './Sidebar';
export * from './SidebarGenericItem';
export * from './SidebarItemsAssembler';
export * from './SidebarNavigationItem';

/**
 * @deprecated Use Sidebar named export instead
 */

export default Object.assign(Sidebar, {
	Content,
	Header,
	GenericItem,
	NavigationItem,
	ItemsAssembler: SidebarItemsAssembler,
	ListItem,
});
