import { createDocumentMapStore } from './DocumentMapStore';

describe('DocumentMapStore', () => {
	describe('Issue #42109: String ID and EJSON binary ID collision', () => {
		const hexId = '6a7fc7b8376b837b4b8aa6c3';
		const ejsonRaw = {
			buffer: { $binary: 'an/HuDdrg3tLiqbD' },
		};

		it('should replace existing string-keyed document when update arrives as EJSON binary representation', () => {
			const store = createDocumentMapStore<{ _id: string; name: string }>();

			// 1. Initial subscription loaded as string ID
			store.getState().store({ _id: hexId, name: 'General - Initial' });
			expect(store.getState().records.size).toBe(1);

			// 2. DDP merge arrives carrying EJSON binary representation of the same logical ID
			store.getState().store({ _id: ejsonRaw as unknown as string, name: 'General - Merged' });

			// MUST replace, NOT duplicate!
			expect(store.getState().records.size).toBe(1);
			const record = store.getState().get(hexId);
			expect(record).toBeDefined();
			expect(record?.name).toBe('General - Merged');
			// Verify the document itself carries the canonical string _id
			expect(record?._id).toBe(hexId);
		});

		it('should replace existing binary-keyed document when update arrives as string ID', () => {
			const store = createDocumentMapStore<{ _id: string; name: string }>();

			// 1. Initial subscription loaded with EJSON binary representation
			store.getState().store({ _id: ejsonRaw as unknown as string, name: 'General - Initial' });
			expect(store.getState().records.size).toBe(1);

			// 2. Subsequent update arrives carrying canonical string ID
			store.getState().store({ _id: hexId, name: 'General - Updated' });

			expect(store.getState().records.size).toBe(1);
			const record = store.getState().get(hexId);
			expect(record).toBeDefined();
			expect(record?.name).toBe('General - Updated');
			expect(record?._id).toBe(hexId);
		});

		it('should delete document by canonical ID when stored with non-string representation', () => {
			const store = createDocumentMapStore<{ _id: string; name: string }>();

			store.getState().store({ _id: ejsonRaw as unknown as string, name: 'To Delete' });
			expect(store.getState().records.size).toBe(1);

			store.getState().delete(hexId);
			expect(store.getState().records.size).toBe(0);
		});

		it('should normalize documents and notify onInvalidate in storeMany', () => {
			const onInvalidate = jest.fn();
			const store = createDocumentMapStore<{ _id: string; name: string }>({ onInvalidate });

			store.getState().storeMany([{ _id: ejsonRaw as unknown as string, name: 'Batch 1' }]);
			expect(store.getState().records.size).toBe(1);
			expect(store.getState().get(hexId)?._id).toBe(hexId);
			expect(onInvalidate).toHaveBeenCalledWith(expect.objectContaining({ _id: hexId, name: 'Batch 1' }));
		});
	});
});
