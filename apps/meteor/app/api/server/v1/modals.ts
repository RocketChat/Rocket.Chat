import { isModalsProps, isModalsInsertProps } from '@rocket.chat/rest-typings';
import { Modals } from '../../../models/server/raw/index';
import { API } from '../api';

API.v1.addRoute(
	'modals',
	{ authRequired: true, validateParams: isModalsInsertProps, permissions: ['manage-modals'] },
	{
		async post() {
			if (!this.userId) {
				return API.v1.failure('error-invalid-user');
			}

			const { content, contentType, title, expires } = this.bodyParams;
			const createdAt = new Date();
			const stmt = await Modals.insertOne({ content, contentType, title, expires, status: true, createdBy: this.userId, createdAt });
			return API.v1.success({ success: stmt.insertedCount ? true : false });
		},
		async delete() {
			if (!this.userId) {
				return API.v1.failure('error-invalid-user');
			}

			const { modalId } = this.bodyParams;

			const stmt = await Modals.deleteModal(modalId);
			return API.v1.success({ success: stmt.modifiedCount ? true : false });
		},
	},
);

