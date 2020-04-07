import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { APIClient } from '../../../../../../../app/utils/client';
import './livechatCloseRoomCustom.html';

Template.livechatCloseRoomCustom.helpers({
    /*
	department() {
		return Template.instance().department.get();
    },
    */
});

Template.livechatCloseRoomCustom.onCreated(function() {
	console.log('aqui');
    /*
	const { id: _id, department: contextDepartment } = this.data;

	this.department = new ReactiveVar(contextDepartment);

	if (!contextDepartment && _id) {
		this.autorun(async () => {
			const { department } = await APIClient.v1.get(`livechat/department/${ _id }`);
			this.department.set(department);
		});
    }
    */
});
