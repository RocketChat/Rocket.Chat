
import { Template } from 'meteor/templating';

import './threads.html';
import '../threads.css';
import { createTemplateForComponent } from '../../../../client/reactAdapters';


createTemplateForComponent('ThreadsList', () => import('../components/ThreadList'), {});

Template.threads.helpers({
	rid() {
		const { rid } = Template.instance().data;
		return rid;
	},
	close() {
		const { data } = Template.instance();
		const { tabBar } = data;
		return () => tabBar.close();
	},
});
