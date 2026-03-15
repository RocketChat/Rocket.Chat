import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

// ---------------------------------------------------------------------------
// Minimal Meteor.Error stand-in — matches the shape thrown by the real thing
// ---------------------------------------------------------------------------
class MeteorError extends Error {
	constructor(
		public error: string,
		public reason: string,
		public details?: any,
	) {
		super(reason);
		this.name = 'Meteor.Error';
	}
}

// ---------------------------------------------------------------------------
// Shared stubs
// ---------------------------------------------------------------------------
const fetchStub = sinon.stub();
const settingsGetStub = sinon.stub();
const fileStoreDeleteByName = sinon.stub().resolves();
const fileStoreInsert = sinon.stub().resolves({ etag: 'test-etag' });
const usersSetAvatarData = sinon.stub().resolves();
const onceTransactionCommitted = sinon.stub().callsFake(async (cb: () => Promise<void>) => cb());
const apiBroadcast = sinon.stub().resolves();

const { setUserAvatar } = proxyquire.noCallThru().load('../../../../../../app/lib/server/functions/setUserAvatar', {
	'@rocket.chat/core-services': {
		api: { broadcast: apiBroadcast },
	},
	'@rocket.chat/models': {
		Users: { setAvatarData: usersSetAvatarData },
	},
	'@rocket.chat/server-fetch': {
		serverFetch: fetchStub,
	},
	'meteor/meteor': {
		Meteor: { Error: MeteorError },
	},
	'../../../../server/database/utils': {
		onceTransactionCommitedSuccessfully: onceTransactionCommitted,
	},
	'../../../../server/lib/logger/system': {
		SystemLogger: { info: sinon.stub() },
	},
	'../../../authorization/server/functions/hasPermission': {
		hasPermissionAsync: sinon.stub().resolves(true),
	},
	'../../../file/server': {
		RocketChatFile: { dataURIParse: sinon.stub() },
	},
	'../../../file-upload/server': {
		FileUpload: {
			getStore: sinon.stub().returns({
				deleteByName: fileStoreDeleteByName,
				insert: fileStoreInsert,
			}),
		},
	},
	'../../../settings/server': {
		settings: { get: settingsGetStub },
	},
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DEFAULT_MAX_SIZE = 104857600; // 100 MB

/** Build a minimal mock response whose body is a sequence of Buffer chunks. */
function makeFetchResponse({
	status = 200,
	contentType = 'image/png',
	contentLength = null as string | null,
	chunks = [Buffer.from('PNG_FAKE_BYTES')] as Buffer[],
} = {}) {
	return {
		status,
		headers: {
			get(key: string): string | null {
				if (key === 'content-type') return contentType;
				if (key === 'content-length') return contentLength;
				return null;
			},
		},
		body: {
			// eslint-disable-next-line require-yield
			async *[Symbol.asyncIterator]() {
				for (const chunk of chunks) {
					yield chunk;
				}
			},
		},
	};
}

const testUser = { _id: 'user123', username: 'testuser' };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('setUserAvatar — URL fetch security', () => {
	beforeEach(() => {
		fetchStub.reset();
		settingsGetStub.reset();
		fileStoreDeleteByName.reset();
		fileStoreInsert.reset();
		usersSetAvatarData.reset();
		apiBroadcast.reset();

		// Default: SSRF allowlist empty string, max size = 100 MB
		settingsGetStub.callsFake((key: string) => {
			if (key === 'SSRF_Allowlist') return '';
			if (key === 'FileUpload_MaxFileSize') return DEFAULT_MAX_SIZE;
			return undefined;
		});
	});

	// -----------------------------------------------------------------------
	// Content-type validation
	// -----------------------------------------------------------------------
	describe('rejects disallowed MIME types', () => {
		const disallowedTypes = ['text/html', 'text/plain', 'application/json', 'image/svg+xml', 'image/gif', 'image/tiff', 'image/x-icon'];

		for (const mime of disallowedTypes) {
			it(`throws error-avatar-invalid-url when server returns ${mime}`, async () => {
				fetchStub.resolves(makeFetchResponse({ contentType: mime }));

				const err = await setUserAvatar(testUser, 'https://example.com/avatar', undefined, 'url').then(
					() => null,
					(e: unknown) => e,
				);

				expect(err).to.be.instanceof(MeteorError);
				expect((err as MeteorError).error).to.equal('error-avatar-invalid-url');
				// Must not have stored anything
				expect(fileStoreInsert.called).to.be.false;
			});
		}
	});

	describe('accepts allowed MIME types', () => {
		const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];

		for (const mime of allowedTypes) {
			it(`resolves successfully for ${mime}`, async () => {
				fetchStub.resolves(makeFetchResponse({ contentType: mime }));

				await setUserAvatar(testUser, 'https://example.com/avatar', undefined, 'url');

				expect(fileStoreInsert.calledOnce).to.be.true;
			});
		}
	});

	it('ignores Content-Type parameters (e.g. image/jpeg; charset=binary)', async () => {
		fetchStub.resolves(makeFetchResponse({ contentType: 'image/jpeg; charset=binary' }));

		await setUserAvatar(testUser, 'https://example.com/avatar', undefined, 'url');
	});

	it('accepts Content-Type values with uppercase letters', async () => {
		fetchStub.resolves(makeFetchResponse({ contentType: 'IMAGE/WEBP' }));

		await setUserAvatar(testUser, 'https://example.com/avatar', undefined, 'url');
		expect(fileStoreInsert.calledOnce).to.be.true;
	});

	it('throws error-avatar-invalid-url when response body is missing', async () => {
		fetchStub.resolves({
			status: 200,
			headers: {
				get(key: string): string | null {
					if (key === 'content-type') return 'image/png';
					return null;
				},
			},
			body: undefined,
		});

		const err = await setUserAvatar(testUser, 'https://example.com/avatar', undefined, 'url').then(
			() => null,
			(e: unknown) => e,
		);

		expect(err).to.be.instanceof(MeteorError);
		expect((err as MeteorError).error).to.equal('error-avatar-invalid-url');
		expect(fileStoreInsert.called).to.be.false;
	});

	// -----------------------------------------------------------------------
	// Size enforcement — Content-Length header
	// -----------------------------------------------------------------------
	describe('Content-Length early rejection', () => {
		it('throws error-avatar-image-too-large when Content-Length exceeds max size', async () => {
			const maxSize = 1000;
			settingsGetStub.callsFake((key: string) => {
				if (key === 'SSRF_Allowlist') return '';
				if (key === 'FileUpload_MaxFileSize') return maxSize;
				return undefined;
			});

			fetchStub.resolves(
				makeFetchResponse({
					contentLength: String(maxSize + 1),
					chunks: [], // body should never be read
				}),
			);

			const err = await setUserAvatar(testUser, 'https://example.com/avatar', undefined, 'url').then(
				() => null,
				(e: unknown) => e,
			);

			expect(err).to.be.instanceof(MeteorError);
			expect((err as MeteorError).error).to.equal('error-avatar-image-too-large');
			expect(fileStoreInsert.called).to.be.false;
		});

		it('allows a response whose Content-Length equals max size exactly', async () => {
			const maxSize = 1000;
			settingsGetStub.callsFake((key: string) => {
				if (key === 'SSRF_Allowlist') return '';
				if (key === 'FileUpload_MaxFileSize') return maxSize;
				return undefined;
			});

			fetchStub.resolves(
				makeFetchResponse({
					contentLength: String(maxSize),
					chunks: [Buffer.alloc(maxSize)],
				}),
			);

			await setUserAvatar(testUser, 'https://example.com/avatar', undefined, 'url');
		});
	});

	// -----------------------------------------------------------------------
	// Size enforcement — streaming byte counter (no Content-Length)
	// -----------------------------------------------------------------------
	describe('streaming byte counter (Content-Length absent)', () => {
		it('throws error-avatar-image-too-large when streamed bytes exceed max size', async () => {
			const maxSize = 10;
			settingsGetStub.callsFake((key: string) => {
				if (key === 'SSRF_Allowlist') return '';
				if (key === 'FileUpload_MaxFileSize') return maxSize;
				return undefined;
			});

			// Two chunks: 6 + 6 = 12 bytes total > 10
			fetchStub.resolves(
				makeFetchResponse({
					contentLength: null, // no Content-Length header
					chunks: [Buffer.alloc(6), Buffer.alloc(6)],
				}),
			);

			const err = await setUserAvatar(testUser, 'https://example.com/avatar', undefined, 'url').then(
				() => null,
				(e: unknown) => e,
			);

			expect(err).to.be.instanceof(MeteorError);
			expect((err as MeteorError).error).to.equal('error-avatar-image-too-large');
			expect(fileStoreInsert.called).to.be.false;
		});

		it('succeeds when streamed bytes are within max size', async () => {
			const maxSize = 100;
			settingsGetStub.callsFake((key: string) => {
				if (key === 'SSRF_Allowlist') return '';
				if (key === 'FileUpload_MaxFileSize') return maxSize;
				return undefined;
			});

			fetchStub.resolves(
				makeFetchResponse({
					contentLength: null,
					chunks: [Buffer.alloc(50), Buffer.alloc(40)], // 90 bytes < 100
				}),
			);

			await setUserAvatar(testUser, 'https://example.com/avatar', undefined, 'url');

			expect(fileStoreInsert.calledOnce).to.be.true;
		});

		it('aborts mid-stream as soon as the limit is crossed (does not buffer all chunks first)', async () => {
			const maxSize = 10;
			let chunksYielded = 0;

			settingsGetStub.callsFake((key: string) => {
				if (key === 'SSRF_Allowlist') return '';
				if (key === 'FileUpload_MaxFileSize') return maxSize;
				return undefined;
			});

			// Three chunks of 6 bytes each; limit is exceeded after the second
			const body = {
				async *[Symbol.asyncIterator]() {
					chunksYielded++;
					yield Buffer.alloc(6); // total: 6 — within limit
					chunksYielded++;
					yield Buffer.alloc(6); // total: 12 — exceeds limit, should throw here
					chunksYielded++;
					yield Buffer.alloc(6); // should never be reached
				},
			};

			fetchStub.resolves({ status: 200, headers: { get: (k: string) => (k === 'content-type' ? 'image/png' : null) }, body });

			const err = await setUserAvatar(testUser, 'https://example.com/avatar', undefined, 'url').then(
				() => null,
				(e: unknown) => e,
			);

			expect(err).to.be.instanceof(MeteorError);
			expect((err as MeteorError).error).to.equal('error-avatar-image-too-large');
			expect(chunksYielded).to.equal(2); // third chunk never consumed
		});
	});

	// -----------------------------------------------------------------------
	// Non-200 responses
	// -----------------------------------------------------------------------
	it('throws error-avatar-invalid-url for a 404 response', async () => {
		fetchStub.resolves(makeFetchResponse({ status: 404 }));

		const err = await setUserAvatar(testUser, 'https://example.com/avatar', undefined, 'url').then(
			() => null,
			(e: unknown) => e,
		);

		expect(err).to.be.instanceof(MeteorError);
		expect((err as MeteorError).error).to.equal('error-avatar-invalid-url');
	});

	it('throws error-avatar-url-handling for a 500 response', async () => {
		fetchStub.resolves(makeFetchResponse({ status: 500 }));

		const err = await setUserAvatar(testUser, 'https://example.com/avatar', undefined, 'url').then(
			() => null,
			(e: unknown) => e,
		);

		expect(err).to.be.instanceof(MeteorError);
		expect((err as MeteorError).error).to.equal('error-avatar-url-handling');
	});

	// -----------------------------------------------------------------------
	// Network / timeout errors
	// -----------------------------------------------------------------------
	it('throws error-avatar-invalid-url when fetch rejects (network error)', async () => {
		fetchStub.rejects(new Error('ECONNREFUSED'));

		const err = await setUserAvatar(testUser, 'https://example.com/avatar', undefined, 'url').then(
			() => null,
			(e: unknown) => e,
		);

		expect(err).to.be.instanceof(MeteorError);
		expect((err as MeteorError).error).to.equal('error-avatar-invalid-url');
	});

	it('throws error-avatar-url-timeout when fetch times out after 30 s', async () => {
		const clock = sinon.useFakeTimers();
		fetchStub.callsFake(async (_url: string, opts: any) => {
			// Synchronously advance past the 30-second AbortController timer
			clock.tick(31_000);
			// controller.signal is now aborted; simulate what node-fetch throws on abort
			if (opts?.signal?.aborted) {
				const abortErr = new Error('The operation was aborted');
				(abortErr as any).name = 'AbortError';
				throw abortErr;
			}
			return makeFetchResponse();
		});

		try {
			const err = await setUserAvatar(testUser, 'https://example.com/avatar', undefined, 'url').then(
				() => null,
				(e: unknown) => e,
			);

			expect(err).to.be.instanceof(MeteorError);
			expect((err as MeteorError).error).to.equal('error-avatar-url-timeout');
		} finally {
			clock.restore();
		}
	});
});
