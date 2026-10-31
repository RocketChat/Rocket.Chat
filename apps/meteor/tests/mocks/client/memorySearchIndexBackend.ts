import type { E2EESearchDoc, E2EESearchRoomState, ISearchIndexBackend } from '@rocket.chat/desktop-api';

/** Keep indexing test data in memory. Search execution is outside this test double's contract. */
export const createMemorySearchIndexBackend = () => {
	const documents = new Map<string, E2EESearchDoc>();
	const states = new Map<string, E2EESearchRoomState>();
	const backend: ISearchIndexBackend = {
		open: async () => ({ schemaVersion: 1, encryptedAtRest: false }),
		async upsert(docs) {
			for (const doc of docs) documents.set(doc.id, { ...doc });
		},
		async remove(ids) {
			for (const id of ids) documents.delete(id);
		},
		async removeRoom(rid) {
			for (const [id, doc] of documents) {
				if (doc.rid === rid) documents.delete(id);
			}
			states.delete(rid);
		},
		listRooms: async () => [...new Set([...documents.values()].map(({ rid }) => rid).concat([...states.keys()]))].sort(),
		async search() {
			throw new Error('Search is not available in indexing tests');
		},
		async getRoomState(rid) {
			const state = states.get(rid);
			return state && { ...state };
		},
		async setRoomState(rid, state) {
			states.set(rid, { ...state });
		},
		stats: async () => ({ docs: documents.size, rooms: states.size, bytes: 0 }),
		async wipe() {
			documents.clear();
			states.clear();
		},
	};
	return Object.assign(backend, { documents, states });
};
