
import { Template } from 'meteor/templating';

import './threads.html';
import '../threads.css';
import { createTemplateForComponent } from '../../../../client/reactAdapters';
import { Rooms } from '../../../models/client';


createTemplateForComponent('ThreadsList', () => import('../components/ThreadList'), {});

Template.threads.helpers({
	room() {
		const { rid } = Template.instance().data;
		return Rooms.findOne({ _id: rid }, {
			reactive: false,
			fields: {
				_updatedAt: 0,
				lastMessage: 0,
			},
		});
	},
	close() {
		const { data } = Template.instance();
		const { tabBar } = data;
		return () => tabBar.close();
	},
});
