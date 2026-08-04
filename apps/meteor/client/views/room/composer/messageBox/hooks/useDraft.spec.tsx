import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useDraft } from './useDraft';

const storageKey = (rid: string, tmid?: string) => `messagebox_${rid}${tmid ? `-${tmid}` : ''}`;

const seedLocalDraft = (value: string, rid: string, tmid?: string) => {
	localStorage.setItem(storageKey(rid, tmid), value);
};

const readLocalDraft = (rid: string, tmid?: string) => localStorage.getItem(storageKey(rid, tmid));

type RenderUseDraftProps = {
	serverDraft?: string;
	threadExists?: boolean;
};

const renderUseDraft = ({
	rid = 'rid',
	serverDraft,
	tmid,
	threadExists,
	endpointHandler = jest.fn(() => null),
}: {
	rid?: string;
	tmid?: string;
	endpointHandler?: jest.Mock;
} & RenderUseDraftProps = {}) => {
	const { result, rerender } = renderHook<ReturnType<typeof useDraft>, RenderUseDraftProps>(
		({ serverDraft, threadExists }) => useDraft(rid, serverDraft, tmid, threadExists),
		{
			initialProps: { serverDraft, threadExists },
			wrapper: mockAppRoot().withEndpoint('POST', '/v1/rooms.saveDraft', endpointHandler).build(),
		},
	);

	return { result, rerender, endpointHandler };
};

afterEach(() => {
	localStorage.clear();
});

describe('initialValue', () => {
	it('should be an empty string when there is no server draft nor local draft', () => {
		const { result } = renderUseDraft();

		expect(result.current.initialValue).toBe('');
	});

	it('should restore the local draft when there is no server draft', () => {
		seedLocalDraft('local draft', 'rid');

		const { result } = renderUseDraft();

		expect(result.current.initialValue).toBe('local draft');
	});

	it('should restore the server draft when provided', () => {
		const { result } = renderUseDraft({ serverDraft: 'server draft' });

		expect(result.current.initialValue).toBe('server draft');
	});

	it('should prefer the server draft over the local draft', () => {
		seedLocalDraft('local draft', 'rid');

		const { result } = renderUseDraft({ serverDraft: 'server draft' });

		expect(result.current.initialValue).toBe('server draft');
	});

	it('should fall back to the local draft when the server draft is an empty string', () => {
		seedLocalDraft('local draft', 'rid');

		const { result } = renderUseDraft({ serverDraft: '' });

		expect(result.current.initialValue).toBe('local draft');
	});

	it('should restore the thread-scoped local draft when a tmid is provided', () => {
		seedLocalDraft('room draft', 'rid');
		seedLocalDraft('thread draft', 'rid', 'tmid');

		const { result } = renderUseDraft({ tmid: 'tmid' });

		expect(result.current.initialValue).toBe('thread draft');
	});

	it('should not restore the room draft in a thread composer', () => {
		seedLocalDraft('room draft', 'rid');

		const { result } = renderUseDraft({ tmid: 'tmid' });

		expect(result.current.initialValue).toBe('');
	});

	it('should remain stable across rerenders even if the server draft changes', () => {
		const { result, rerender } = renderUseDraft({ serverDraft: 'first' });

		rerender({ serverDraft: 'second' });

		expect(result.current.initialValue).toBe('first');
	});
});

describe('persistLocal', () => {
	it('should write the draft to local storage under the room-scoped key', () => {
		const { result } = renderUseDraft();

		act(() => {
			result.current.persistLocal('typed message');
		});

		expect(readLocalDraft('rid')).toBe('typed message');
	});

	it('should write the draft to local storage under the thread-scoped key when a tmid is provided', () => {
		const { result } = renderUseDraft({ tmid: 'tmid' });

		act(() => {
			result.current.persistLocal('typed in thread');
		});

		expect(readLocalDraft('rid', 'tmid')).toBe('typed in thread');
		expect(readLocalDraft('rid')).toBe(null);
	});

	it('should overwrite a previously persisted draft', () => {
		const { result } = renderUseDraft();

		act(() => {
			result.current.persistLocal('first');
			result.current.persistLocal('second');
		});

		expect(readLocalDraft('rid')).toBe('second');
	});

	it('should remove the local entry instead of storing an empty string', () => {
		seedLocalDraft('local draft', 'rid');

		const { result } = renderUseDraft();

		act(() => {
			result.current.persistLocal('');
		});

		expect(readLocalDraft('rid')).toBe(null);
	});

	it('should not call the save draft endpoint', () => {
		const { result, endpointHandler } = renderUseDraft();

		act(() => {
			result.current.persistLocal('typed message');
		});

		expect(endpointHandler).not.toHaveBeenCalled();
	});
});

describe('flushDraft', () => {
	it('should not call the save draft endpoint when no draft was persisted', () => {
		const { result, endpointHandler } = renderUseDraft();

		act(() => {
			result.current.flushDraft();
		});

		expect(endpointHandler).not.toHaveBeenCalled();
	});

	it('should not flush a draft restored from local storage that was never re-persisted', () => {
		seedLocalDraft('restored draft', 'rid');

		const { result, endpointHandler } = renderUseDraft();

		act(() => {
			result.current.flushDraft();
		});

		expect(endpointHandler).not.toHaveBeenCalled();
	});

	it('should save the persisted draft to the server', async () => {
		const { result, endpointHandler } = renderUseDraft();

		act(() => {
			result.current.persistLocal('typed message');
			result.current.flushDraft();
		});

		await waitFor(() => expect(endpointHandler).toHaveBeenCalledTimes(1));
		expect(endpointHandler).toHaveBeenCalledWith({ rid: 'rid', draft: 'typed message' });
	});

	it('should remove the local copy once the draft is saved to the server', async () => {
		const { result } = renderUseDraft();

		act(() => {
			result.current.persistLocal('typed message');
			result.current.flushDraft();
		});

		await waitFor(() => expect(readLocalDraft('rid')).toBe(null));
	});

	it('should include the tmid when flushing a thread draft', async () => {
		const { result, endpointHandler } = renderUseDraft({ tmid: 'tmid' });

		act(() => {
			result.current.persistLocal('typed in thread');
			result.current.flushDraft();
		});

		await waitFor(() => expect(endpointHandler).toHaveBeenCalledTimes(1));
		expect(endpointHandler).toHaveBeenCalledWith({ rid: 'rid', draft: 'typed in thread', tmid: 'tmid' });
	});

	it('should flush only the latest persisted draft', async () => {
		const { result, endpointHandler } = renderUseDraft();

		act(() => {
			result.current.persistLocal('first');
			result.current.persistLocal('second');
			result.current.flushDraft();
		});

		await waitFor(() => expect(endpointHandler).toHaveBeenCalledTimes(1));
		expect(endpointHandler).toHaveBeenCalledWith({ rid: 'rid', draft: 'second' });
	});

	it('should flush an empty draft to clear an existing server draft', async () => {
		const { result, endpointHandler } = renderUseDraft({ serverDraft: 'server draft' });

		act(() => {
			result.current.persistLocal('');
			result.current.flushDraft();
		});

		await waitFor(() => expect(endpointHandler).toHaveBeenCalledTimes(1));
		expect(endpointHandler).toHaveBeenCalledWith({ rid: 'rid', draft: '' });
	});

	it('should not call the endpoint when flushing an empty draft with no existing server draft', () => {
		const { result, endpointHandler } = renderUseDraft();

		act(() => {
			result.current.persistLocal('');
			result.current.flushDraft();
		});

		expect(endpointHandler).not.toHaveBeenCalled();
	});

	it('should not re-save a restored server draft that was not edited', () => {
		const { result, endpointHandler } = renderUseDraft({ serverDraft: 'server draft' });

		act(() => {
			result.current.persistLocal('server draft');
			result.current.flushDraft();
		});

		expect(endpointHandler).not.toHaveBeenCalled();
	});

	it('should not flush the same draft twice', async () => {
		const { result, endpointHandler } = renderUseDraft();

		act(() => {
			result.current.persistLocal('typed message');
			result.current.flushDraft();
			result.current.flushDraft();
		});

		await waitFor(() => expect(endpointHandler).toHaveBeenCalledTimes(1));
	});

	it('should flush again after a new draft is persisted', async () => {
		const { result, endpointHandler } = renderUseDraft();

		act(() => {
			result.current.persistLocal('first');
			result.current.flushDraft();
			result.current.persistLocal('second');
			result.current.flushDraft();
		});

		await waitFor(() => expect(endpointHandler).toHaveBeenCalledTimes(2));
		expect(endpointHandler).toHaveBeenNthCalledWith(1, { rid: 'rid', draft: 'first' });
		expect(endpointHandler).toHaveBeenNthCalledWith(2, { rid: 'rid', draft: 'second' });
	});

	it('should not save the draft to the server when the thread does not exist', () => {
		const { result, endpointHandler } = renderUseDraft({ tmid: 'tmid', threadExists: false });

		act(() => {
			result.current.persistLocal('typed in deleted thread');
			result.current.flushDraft();
		});

		expect(endpointHandler).not.toHaveBeenCalled();
	});

	it('should keep the draft in local storage when the thread does not exist', () => {
		const { result } = renderUseDraft({ tmid: 'tmid', threadExists: false });

		act(() => {
			result.current.persistLocal('typed in deleted thread');
			result.current.flushDraft();
		});

		expect(readLocalDraft('rid', 'tmid')).toBe('typed in deleted thread');
	});

	it('should keep discarding drafts persisted after a flush while the thread does not exist', () => {
		const { result, endpointHandler } = renderUseDraft({ tmid: 'tmid', threadExists: false });

		act(() => {
			result.current.persistLocal('first');
			result.current.flushDraft();
			result.current.persistLocal('second');
			result.current.flushDraft();
		});

		expect(endpointHandler).not.toHaveBeenCalled();
	});

	it('should not save the draft when the thread stops existing after mount', () => {
		const { result, rerender, endpointHandler } = renderUseDraft({ tmid: 'tmid', threadExists: true });

		act(() => {
			result.current.persistLocal('typed before thread deletion');
		});

		rerender({ threadExists: false });

		act(() => {
			result.current.flushDraft();
		});

		expect(endpointHandler).not.toHaveBeenCalled();
	});

	it('should save the draft when the thread starts existing after mount', async () => {
		const { result, rerender, endpointHandler } = renderUseDraft({ tmid: 'tmid', threadExists: false });

		rerender({ threadExists: true });

		act(() => {
			result.current.persistLocal('typed in new thread');
			result.current.flushDraft();
		});

		await waitFor(() => expect(endpointHandler).toHaveBeenCalledTimes(1));
		expect(endpointHandler).toHaveBeenCalledWith({ rid: 'rid', draft: 'typed in new thread', tmid: 'tmid' });
	});

	it('should still save the draft when threadExists is false but there is no tmid', async () => {
		const { result, endpointHandler } = renderUseDraft({ threadExists: false });

		act(() => {
			result.current.persistLocal('typed message');
			result.current.flushDraft();
		});

		await waitFor(() => expect(endpointHandler).toHaveBeenCalledTimes(1));
		expect(endpointHandler).toHaveBeenCalledWith({ rid: 'rid', draft: 'typed message' });
	});
});

describe('referential stability', () => {
	it('should keep persistLocal and flushDraft identities across rerenders', () => {
		const { result, rerender } = renderUseDraft();

		const { persistLocal, flushDraft } = result.current;

		rerender({});

		expect(result.current.persistLocal).toBe(persistLocal);
		expect(result.current.flushDraft).toBe(flushDraft);
	});
});
