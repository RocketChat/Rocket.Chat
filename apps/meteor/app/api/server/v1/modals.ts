import { isModalsProps, isModalsInsertProps } from '@rocket.chat/rest-typings';
import { Modals, ModalsDismiss } from '../../../models/server/raw/index';
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

API.v1.addRoute(
	'modals/dismiss',
	{ authRequired: true, validateParams: isModalsProps },
	{
		async post() {
			if (!this.userId) {
				return API.v1.failure('error-invalid-user');
			}
			const { modalId } = this.bodyParams;

			if (await Modals.findOne({ _id: modalId, status: true })) {
				return API.v1.notFound();
			}

			const modalsDismiss = await ModalsDismiss.findOneByModalIdAndUserId(modalId, this.userId, { projection: { _id: 1 } });
			if (modalsDismiss) {
				return API.v1.failure('error-modal-already-dismissed');
			}
			await ModalsDismiss.insertOne({ _modal: modalId, _user: this.userId, createdAt: new Date() });
			return API.v1.success({ success: true });
		},
		async delete() {
			if (!this.userId) {
				return API.v1.failure('error-invalid-user');
			}
			const { modalId } = this.bodyParams;

			if (await Modals.findOne({ _id: modalId, status: true })) {
				return API.v1.notFound();
			}

			const stmt = await ModalsDismiss.removeUserByUserIdAndId(modalId, this.userId);
			if (stmt.deletedCount) {
				return API.v1.success({ success: true });
			} else {
				return API.v1.failure('error-modal-not-dismissed');
			}
		},
	},
);
