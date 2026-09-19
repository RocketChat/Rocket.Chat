import { createDocumentMapStore } from './DocumentMapStore';

interface ITestRecord {
	_id: string;
	name: string;
}

describe('DocumentMapStore', () => {
	describe('non-string _id normalization', () => {
		it('replaces the previous entry when the same BSON ObjectId-like _id is stored twice', () => {
			const useStore = createDocumentMapStore<ITestRecord>();

			// A Mongo ObjectId instance: not a string, but exposes toHexString().
			const objectIdLike = { toHexString: () => '507f1f77bcf86cd799439011' };

			useStore.getState().store({ _id: objectIdLike as unknown as string, name: 'first' });
			// A distinct object instance representing the *same* id, as would arrive on a second DDP merge.
			const secondInstance = { toHexString: () => '507f1f77bcf86cd799439011' };
			useStore.getState().store({ _id: secondInstance as unknown as string, name: 'second' });

			expect(useStore.getState().records.size).toBe(1);
			expect(Array.from(useStore.getState().records.values())[0].name).toBe('second');
		});

		it('replaces the previous entry when the same EJSON binary _id is stored twice', () => {
			const useStore = createDocumentMapStore<ITestRecord>();

			const binaryId = { buffer: { $binary: 'an/HuDdrg3tLiqbD' } };

			useStore.getState().store({ _id: binaryId as unknown as string, name: 'first' });
			useStore.getState().store({ _id: { buffer: { $binary: 'an/HuDdrg3tLiqbD' } } as unknown as string, name: 'second' });

			expect(useStore.getState().records.size).toBe(1);
		});

		it('deletes a record stored with a non-string _id when given an equivalent but distinct instance', () => {
			const useStore = createDocumentMapStore<ITestRecord>();

			useStore.getState().store({ _id: { toHexString: () => 'abc123' } as unknown as string, name: 'first' });
			useStore.getState().delete({ toHexString: () => 'abc123' } as unknown as string);

			expect(useStore.getState().records.size).toBe(0);
		});

		it('does not collapse different ids into the same entry', () => {
			const useStore = createDocumentMapStore<ITestRecord>();

			useStore.getState().store({ _id: { toHexString: () => 'aaa' } as unknown as string, name: 'first' });
			useStore.getState().store({ _id: { toHexString: () => 'bbb' } as unknown as string, name: 'second' });

			expect(useStore.getState().records.size).toBe(2);
		});

		it('still works for plain string ids (no regression)', () => {
			const useStore = createDocumentMapStore<ITestRecord>();

			useStore.getState().store({ _id: 'room-1', name: 'first' });
			useStore.getState().store({ _id: 'room-1', name: 'updated' });

			expect(useStore.getState().records.size).toBe(1);
			expect(useStore.getState().get('room-1')?.name).toBe('updated');
		});
	});
});
