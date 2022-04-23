export class CreateObject {
	createdAt: Date;

	_updatedAt: Date;

	constructor() {
		this.createdAt = new Date();
		this._updatedAt = new Date();
	}
}
