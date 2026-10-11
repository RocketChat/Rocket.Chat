import { setUpdatedAt } from './setUpdatedAt';

describe('setUpdatedAt', () => {
	it('should set _updatedAt at the root of a plain document', () => {
		const record: Record<string, any> = { name: 'a' };

		setUpdatedAt(record);

		expect(record._updatedAt).toBeInstanceOf(Date);
	});

	it('should set _updatedAt under $set of an operator update', () => {
		const record: Record<string, any> = { $inc: { msgs: 1 } };

		setUpdatedAt(record);

		expect(record.$set._updatedAt).toBeInstanceOf(Date);
		expect(record.$inc).toEqual({ msgs: 1 });
	});

	it('should append a $set stage to a pipeline update', () => {
		const pipeline: Record<string, any>[] = [{ $set: { dcount: { $add: ['$dcount', 1] } } }];

		setUpdatedAt(pipeline);

		expect(pipeline).toHaveLength(2);
		expect(pipeline[0]).toEqual({ $set: { dcount: { $add: ['$dcount', 1] } } });
		expect(pipeline[1].$set._updatedAt).toBeInstanceOf(Date);
	});

	it('should not grow the pipeline when the same array is updated twice', () => {
		const pipeline: Record<string, any>[] = [{ $set: { dcount: 1 } }];

		setUpdatedAt(pipeline);
		const first = pipeline[1].$set._updatedAt;
		setUpdatedAt(pipeline);

		expect(pipeline).toHaveLength(2);
		expect(pipeline[1].$set._updatedAt).toBeInstanceOf(Date);
		expect(pipeline[1].$set._updatedAt.getTime()).toBeGreaterThanOrEqual(first.getTime());
	});

	it('should overwrite an _updatedAt the pipeline sets on its own last stage', () => {
		const pipeline: Record<string, any>[] = [{ $set: { 'v.activity': ['2026-09'], '_updatedAt': '$$NOW' } }];

		setUpdatedAt(pipeline);

		expect(pipeline).toHaveLength(1);
		expect(pipeline[0].$set._updatedAt).toBeInstanceOf(Date);
		expect(pipeline[0].$set['v.activity']).toEqual(['2026-09']);
	});

	it('should append a stage when the last pipeline stage is not a $set', () => {
		const pipeline: Record<string, any>[] = [{ $set: { a: 1 } }, { $unset: ['b'] }];

		setUpdatedAt(pipeline);

		expect(pipeline).toHaveLength(3);
		expect(pipeline[2].$set._updatedAt).toBeInstanceOf(Date);
	});
});
