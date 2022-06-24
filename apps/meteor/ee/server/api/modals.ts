import { isModalsProps } from '../../definition/rest/v1/modals';
import { Modals } from '../../../app/models/server/raw/index';
import { API } from '../../../app/api/server/api';
import { hasLicense } from '../../app/license/server/license';

API.v1.addRoute(
	'modals/me',
	{ authRequired: true, validateParams: isModalsProps },
	{
		async put() {
			if (!this.userId) {
				return API.v1.failure('error-invalid-user');
			}
			if (!hasLicense('modal-management')) {
				return API.v1.unauthorized();
			}

			const { modalId } = this.bodyParams;

			const { matchedCount, modifiedCount } = await Modals.addUserByIdAndUserId(modalId, this.userId);
			return API.v1.success({ matchedCount, modifiedCount });
		},
		async delete() {
			if (!this.userId) {
				return API.v1.failure('error-invalid-user');
			}
			if (!hasLicense('modal-management')) {
				return API.v1.unauthorized();
			}

			const { modalId } = this.bodyParams;

			const { matchedCount, modifiedCount } = await Modals.removeUserByUserIdAndId(modalId, this.userId);
			return API.v1.success({ matchedCount, modifiedCount });
		},
	},
);
