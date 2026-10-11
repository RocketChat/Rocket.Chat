import { mapMessageFromApi } from './mapMessageFromApi';

it('should convert all date fields to Date objects', () => {
	const now = new Date();
	const iso = now.toISOString();
	const input = {
		_id: 'id',
		ts: iso,
		_updatedAt: iso,
		pinnedAt: iso,
		tlm: iso,
		webRtcCallEndTs: iso,
		editedAt: iso,
		dlm: iso,
		msg: 'hi',
		u: { _id: 'u', username: 'user' },
		rid: 'r',
		attachments: [{ ts: iso, title: 'attach' }],
	};
	const result = mapMessageFromApi(input);
	expect(result.ts).toBeInstanceOf(Date);
	expect(result._updatedAt).toBeInstanceOf(Date);
	expect(result.pinnedAt).toBeInstanceOf(Date);
	expect(result.tlm).toBeInstanceOf(Date);
	expect(result.webRtcCallEndTs).toBeInstanceOf(Date);
	expect(result.editedAt).toBeInstanceOf(Date);
	expect(result.dlm).toBeInstanceOf(Date);
	expect(result.attachments?.[0].ts).toBeInstanceOf(Date);
});

it('should not set missing optional dates', () => {
	const input = {
		_id: 'id',
		ts: new Date().toISOString(),
		_updatedAt: new Date().toISOString(),
		msg: 'hi',
		u: { _id: 'u', username: 'user' },
		rid: 'r',
	};
	const result = mapMessageFromApi(input);
	expect(result.pinnedAt).toBeUndefined();
	expect(result.tlm).toBeUndefined();
	expect(result.webRtcCallEndTs).toBeUndefined();
	expect(result.editedAt).toBeUndefined();
	expect(result.dlm).toBeUndefined();
});
