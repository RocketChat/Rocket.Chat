import { Template } from 'meteor/templating';

import './DiscussionTabbar.html';

Template.discussionsTabbar.helpers({
	close() {
		const { data } = Template.instance();
		const { tabBar } = data;
		return () => tabBar.close();
	},
});
