export const useSidebarClose = (): {
	closeSidebar: () => void;
} => {
	const closeSidebar = (): void => {
		const sidebarWrap = $('.sidebar-wrap');
		const sidebar = $('.sidebar');
		const wrapper = $('.messages-box > .wrapper');

		sidebarWrap.css('width', '');
		sidebarWrap.css('background-color', '');
		sidebar.css('transform', '');
		sidebar.css('box-shadow', '');
		sidebar.css('transition', '');
		sidebarWrap.css('transition', '');
		wrapper && wrapper.css('overflow', '');
	};

	return { closeSidebar };
};
