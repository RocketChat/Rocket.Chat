export class BaseModelMock {
	findOneById(id) {
		return this.data[id];
	}
}
