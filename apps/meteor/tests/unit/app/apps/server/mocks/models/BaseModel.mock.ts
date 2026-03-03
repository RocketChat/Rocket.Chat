export class BaseModelMock<T> {
	protected data: Record<string, T> = {};

	findOneById(id: string): T | null {
		return this.data[id];
	}
}
