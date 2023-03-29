import { LivechatDepartment } from '../../../../../app/models/server/models/LivechatDepartment';
import { overwriteClassOnLicense } from '../../../license/server';

const { find, findOne, update, remove } = LivechatDepartment.prototype;

overwriteClassOnLicense('livechat-enterprise', LivechatDepartment, {
	unfilteredFind(originalFn, ...args) {
		return find.apply(this, args);
	},
	unfilteredFindOne(originalFn, ...args) {
		return findOne.apply(this, args);
	},
	unfilteredUpdate(originalFn, ...args) {
		return update.apply(this, args);
	},
	unfilteredRemove(originalFn, ...args) {
		return remove.apply(this, args);
	},
	createOrUpdateDepartment(originalFn, ...args) {
		if (args.length > 2 && !args[1].type) {
			args[1].type = 'd';
		}

		return originalFn.apply(this, args);
	},
	removeParentAndAncestorById(originalFn, parentId) {
		const query = {
			parentId,
		};

		const update = {
			$unset: { parentId: 1 },
			$pull: { ancestors: parentId },
		};

		return this.update(query, update, { multi: true });
	},
});
