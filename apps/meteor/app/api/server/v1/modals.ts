import { isModalsProps, isModalsInsertProps } from '@rocket.chat/rest-typings';

import { Modals, ModalsDismiss } from '../../../models/server/raw';
import { API } from '../api';

API.v1.addRoute(
	'modals',
	{ authRequired: true, validateParams: isModalsInsertProps, permissionsRequired: ['manage-modals'] },
	{
		async post() {
			if (!this.userId) {
				return API.v1.failure('error-invalid-user');
			}
			const { content, contentType, title, expires } = this.bodyParams;
			const createdAt = new Date();

			const stmt = await Modals.insertOne({ content, contentType, title, expires, active: true, createdBy: this.userId, createdAt });

			if (!stmt.insertedCount) return API.v1.failure('error-modal-not-created');

			return API.v1.success();
		},
	},
);
API.v1.addRoute(
	'modals/remove',
	{ authRequired: true, validateParams: isModalsProps, permissionsRequired: ['manage-modals'] },
	{
		async delete() {
			if (!this.userId) {
				return API.v1.failure('error-invalid-user');
			}

			const { modalId } = this.bodyParams;
			const modal = await Modals.findOne({ _id: modalId, active: true });
			if (!modal) {
				return API.v1.notFound();
			}

			const stmt = await Modals.deleteModal(modalId);

			if (!stmt.modifiedCount) return API.v1.failure('error-modal-not-deleted');

			return API.v1.success();
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

			if (!(await Modals.findOne({ _id: modalId, active: true }))) {
				return API.v1.notFound();
			}

			const modalsDismiss = await ModalsDismiss.findOneByModalIdAndUserId(modalId, this.userId, { projection: { _id: 1 } });
			if (modalsDismiss) {
				return API.v1.failure('error-modal-already-dismissed');
			}
			await ModalsDismiss.insertOne({ _modal: modalId, _user: this.userId, createdAt: new Date() });
			return API.v1.success();
		},
		async delete() {
			if (!this.userId) {
				return API.v1.failure('error-invalid-user');
			}
			const { modalId } = this.bodyParams;
			const modal = await Modals.findOne({ _id: modalId, active: true });
			if (!modal) {
				return API.v1.notFound();
			}

			const stmt = await ModalsDismiss.removeUserByUserIdAndId(modalId, this.userId);
			if (stmt.deletedCount) {
				return API.v1.success();
			}
			return API.v1.failure('error-modal-not-dismissed');
		},
	},
);
