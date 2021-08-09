import { BaseRaw } from './BaseRaw';

export class UploadRaw extends BaseRaw {
	deleteOneById(id) {
		return this.col.deleteOne({
			_id: id,
		});
	}
}
