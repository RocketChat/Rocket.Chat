import {
	buildAgentRecord110,
	buildSeatEnvelope110,
	parseStoredRecord110,
	revisionBytesToUtf8,
	validateEngineReport110,
} from './recordContract';
import {
	AiAgentValidationError,
	containsSecretShape,
	formatModelRoute,
	isSeatAllowedPublicTool,
	parseModelRoute,
	validateAgentInstructions,
	validateAgentName,
} from './textValidation';

// Shared C01 golden vectors (matching agent-core service/contract/fixtures/seat-record-vectors.json)
const GOLDEN_PUBLISHED_RAW =
	'{"contractVersion":"1.1.0","id":"seat-1","version":1732450000001,"updatedAt":"2026-11-24T12:00:00.000Z","name":"Docs Helper","instructions":"Answer Rocket.Chat questions concisely from the public documentation.","model":{"provider":"openrouter","id":"openai/gpt-4o-mini"},"tools":["docs_search","docs_read"],"skills":{"commit":"438544159fd6359527759d2a97dd227ae9f6c58c","ids":["public-docs"]},"memory":{"retentionDays":7},"limits":{"perPersonHour":10,"perPersonDay":50,"dailySpendUsd":1.5},"status":"published","chat":{"claim":"11111111-2222-4333-8444-555555555555","rooms":["room-general"]}}';
const GOLDEN_PUBLISHED_SHA256 = '2089e4d3ed4202495c1f9922790d87d391dc294da49700c8727f4f857ba834ca';

const GOLDEN_DISABLED_RAW =
	'{"contractVersion":"1.1.0","id":"seat-1","version":1732450000002,"updatedAt":"2026-11-24T12:00:00.000Z","name":"Docs Helper","instructions":"Answer Rocket.Chat questions concisely from the public documentation.","model":{"provider":"openrouter","id":"openai/gpt-4o-mini"},"tools":["docs_search","docs_read"],"skills":{"commit":"438544159fd6359527759d2a97dd227ae9f6c58c","ids":["public-docs"]},"memory":{"retentionDays":7},"limits":{"perPersonHour":10,"perPersonDay":50,"dailySpendUsd":1.5},"status":"disabled","chat":{"claim":"11111111-2222-4333-8444-555555555555","rooms":["room-general"]}}';
const GOLDEN_DISABLED_SHA256 = '7abf67682e0b2f85dbc61e64f212e70274fcd1259e57edd07e44ac0072fbce12';

// Shared secret-shape vectors split into parts so static scanners never trip on synthetic fixtures.
const SECRET_SHAPE_POSITIVE: Array<{ id: string; parts: string[] }> = [
	{ id: 'private-key-header', parts: ['Please load ', '-----BEGIN ', 'RSA PRIVATE KEY-----', ' before replying.'] },
	{ id: 'ec-private-key-header', parts: ['-----BEGIN ', 'EC PRIVATE KEY-----'] },
	{ id: 'openai-style-key-prefix', parts: ['Use key ', 'sk-proj-', 'SyntheticAlphaNum0123456789', ' for calls.'] },
	{ id: 'github-classic-token-prefix', parts: ['Token ', 'ghp_', 'SyntheticToken0123456789ABCDEF'] },
	{ id: 'github-fine-grained-pat', parts: ['Token ', 'github_pat_', '11SYNTHETIC0123456789_abcdef0123456789'] },
	{ id: 'slack-bot-token-prefix', parts: ['Bot ', 'xoxb-', '123456789012-123456789012-SyntheticToken1234'] },
	{ id: 'cloud-access-key-id', parts: ['Key ', 'AKIA', 'SYNTHETIC0123456'] },
	{ id: 'jwt-token', parts: ['Bearer ', 'eyJhbGciOiJIUzI1NiJ9', '.', 'eyJzdWIiOiJzeW50aGV0aWMifQ', '.', 'SyntheticSignature0123456789_-'] },
	{ id: 'high-entropy-base64url-48', parts: ['Secret ', 'AbCdEfGhIjKlMnOpQrStUvWx', '0123456789YzAbCdEfGhIjKl'] },
];

const SECRET_SHAPE_NEGATIVE: Array<{ id: string; text: string }> = [
	{ id: 'git-commit-sha-40', text: 'Pin documentation to commit 438544159fd6359527759d2a97dd227ae9f6c58c.' },
	{ id: 'uuid-v4', text: 'Reference correlation id c7e4b2a1-8f39-4d6e-a512-90c3f7e81b44 when triaging.' },
	{
		id: 'public-docs-url-with-long-slug',
		text: 'Check https://docs.rocket.chat/docs/WorkspaceAdministrationAndChannelPermissionsGuide2026Revision10 for details.',
	},
	{ id: 'ordinary-technical-prose', text: 'Answer Rocket.Chat questions concisely using public documentation and cite the page URL.' },
	{ id: 'lowercase-48-char-identifier', text: 'namespace_this_is_a_very_long_lowercase_configuration_identifier_name' },
];

describe('C01 1.1.0 record & envelope parity', () => {
	it('matches the publishedPublicDocs C01 golden vector byte-for-byte and SHA-256', () => {
		const built = buildAgentRecord110({
			id: 'seat-1',
			version: 1732450000001,
			updatedAt: '2026-11-24T12:00:00.000Z',
			name: 'Docs Helper',
			instructions: 'Answer Rocket.Chat questions concisely from the public documentation.',
			model: { provider: 'openrouter', id: 'openai/gpt-4o-mini' },
			tools: ['docs_search', 'docs_read'],
			skills: { commit: '438544159fd6359527759d2a97dd227ae9f6c58c', ids: ['public-docs'] },
			memory: { retentionDays: 7 },
			limits: { perPersonHour: 10, perPersonDay: 50, dailySpendUsd: 1.5 },
			status: 'published',
			chat: { claim: '11111111-2222-4333-8444-555555555555', rooms: ['room-general'] },
		});

		expect(built.rawBytes).toBe(GOLDEN_PUBLISHED_RAW);
		expect(built.digest).toBe(GOLDEN_PUBLISHED_SHA256);
	});

	it('matches the disabledHead C01 golden vector byte-for-byte and SHA-256', () => {
		const built = buildAgentRecord110({
			id: 'seat-1',
			version: 1732450000002,
			updatedAt: '2026-11-24T12:00:00.000Z',
			name: 'Docs Helper',
			instructions: 'Answer Rocket.Chat questions concisely from the public documentation.',
			model: { provider: 'openrouter', id: 'openai/gpt-4o-mini' },
			tools: ['docs_search', 'docs_read'],
			skills: { commit: '438544159fd6359527759d2a97dd227ae9f6c58c', ids: ['public-docs'] },
			memory: { retentionDays: 7 },
			limits: { perPersonHour: 10, perPersonDay: 50, dailySpendUsd: 1.5 },
			status: 'disabled',
			chat: { claim: '11111111-2222-4333-8444-555555555555', rooms: ['room-general'] },
		});

		expect(built.rawBytes).toBe(GOLDEN_DISABLED_RAW);
		expect(built.digest).toBe(GOLDEN_DISABLED_SHA256);
	});

	it('omits bytes in 1.1.0 envelopes when unavailable and preserves exact fields when present', () => {
		const unavailable = buildSeatEnvelope110({
			requestId: '11111111-2222-4333-8444-555555555555',
			engineId: 'eng-1',
			seatId: 'seat-1',
			seatState: 'claimed',
			kind: 'head',
			headVersion: 1732450000001,
			version: 1732450000001,
			digest: null,
		});
		expect(unavailable).not.toHaveProperty('bytes');
		expect(unavailable).toMatchObject({ contractVersion: '1.1.0', digest: null, headVersion: 1732450000001 });
	});
});

describe('R02 text boundary, NFC normalization, and secret-shape refusal (no echo)', () => {
	it.each(SECRET_SHAPE_POSITIVE)('refuses secret-shape vector $id without echoing input', ({ parts }) => {
		const sample = parts.join('');
		expect(containsSecretShape(sample)).toBe(true);

		let caught: unknown;
		try {
			validateAgentInstructions(sample);
		} catch (error) {
			caught = error;
		}
		expect(caught).toBeInstanceOf(AiAgentValidationError);
		expect((caught as AiAgentValidationError).code).toBe('text-secret-shape');
		expect((caught as Error).message).toBe('text-secret-shape');
		expect((caught as Error).message).not.toContain(parts[1]);
	});

	it.each(SECRET_SHAPE_NEGATIVE)('allows benign vector $id', ({ text }) => {
		expect(containsSecretShape(text)).toBe(false);
		expect(validateAgentInstructions(text)).toBe(text.normalize('NFC'));
	});

	it('normalizes NFD to NFC before length check and refuses control chars, NUL, and oversize values', () => {
		// 64 decomposed 'e' + combining acute accent normalizes to 64 NFC code points (valid).
		const decomposed64 = 'e\u0301'.repeat(64);
		expect(validateAgentName(decomposed64)).toBe('\u00e9'.repeat(64));

		expect(() => validateAgentName('a'.repeat(65))).toThrow('name-too-long');
		expect(() => validateAgentName('bad\nname')).toThrow('name-control-char');
		expect(() => validateAgentInstructions('bad\u0000body')).toThrow('instructions-nul-char');
		expect(() => validateAgentInstructions('x'.repeat(16 * 1024 + 1))).toThrow('instructions-too-large');
	});

	it('enforces the seat public-docs tool ceiling and refuses thread/file/credentialed prefixes', () => {
		expect(isSeatAllowedPublicTool('docs_search')).toBe(true);
		expect(isSeatAllowedPublicTool('docs_read')).toBe(true);
		expect(isSeatAllowedPublicTool('thread_read')).toBe(false);
		expect(isSeatAllowedPublicTool('file_read')).toBe(false);
		expect(isSeatAllowedPublicTool('zoho_ticket')).toBe(false);
		expect(isSeatAllowedPublicTool('jira_issue')).toBe(false);
		expect(isSeatAllowedPublicTool('github_read_file')).toBe(false);
		expect(isSeatAllowedPublicTool('reproduce')).toBe(false);
	});
});

describe('1.1.0 engine report validation', () => {
	const validReport = {
		contractVersion: '1.1.0',
		engineId: 'eng-1',
		workspaceId: 'ws-1',
		reportedAt: '2026-11-24T12:00:00.000Z',
		catalogue: {
			tools: ['docs_search', 'docs_read'],
			skillsCommit: '438544159fd6359527759d2a97dd227ae9f6c58c',
			skills: ['public-docs'],
			modelRoutes: ['openrouter/openai/gpt-4o-mini'],
		},
		seats: [
			{
				seatId: 'seat-1',
				botId: 'bot-1',
				state: 'provisioned',
				availability: 'unavailable',
				reason: 'seat-provisioned',
				allowedRooms: ['room-1'],
				acceptedVersion: 0,
				poisonFloor: 0,
				identity120Seen: false,
				admittedQuestionSeen: false,
			},
		],
	};

	it('accepts a valid 1.1.0 report matching authenticated engineId', () => {
		const res = validateEngineReport110(validReport, 'eng-1');
		expect(res.ok).toBe(true);
	});

	it('rejects mismatched engineId and non-1.1.0 contractVersion', () => {
		expect(validateEngineReport110(validReport, 'eng-other')).toEqual({ ok: false, error: 'engine-id-mismatch' });
		expect(validateEngineReport110({ ...validReport, contractVersion: '1.0.0' }, 'eng-1')).toEqual({
			ok: false,
			error: 'contract-version-unsupported',
		});
	});
});

describe('cross-realm BSON Binary decoding and model route contract parity', () => {
	it('decodes foreign-realm BSON Binary instances with length() or position-only and padded buffers', () => {
		const payload = Buffer.from(GOLDEN_PUBLISHED_RAW, 'utf8');
		const padded = Buffer.alloc(payload.byteLength + 16, 0x20);
		payload.copy(padded, 8);
		const view = new Uint8Array(padded.buffer, padded.byteOffset + 8, payload.byteLength + 8);

		const foreignWithLength = {
			_bsontype: 'Binary' as const,
			buffer: view,
			position: payload.byteLength,
			length: () => payload.byteLength,
		};
		expect(revisionBytesToUtf8(foreignWithLength as unknown as Buffer)).toBe(GOLDEN_PUBLISHED_RAW);
		expect(parseStoredRecord110(foreignWithLength as unknown as Buffer)?.name).toBe('Docs Helper');

		const foreignPositionOnly = {
			_bsontype: 'Binary' as const,
			buffer: view,
			position: payload.byteLength,
		};
		expect(revisionBytesToUtf8(foreignPositionOnly as unknown as Buffer)).toBe(GOLDEN_PUBLISHED_RAW);
		expect(parseStoredRecord110(foreignPositionOnly as unknown as Buffer)?.chat.rooms).toEqual(['room-general']);
	});

	it('parses and formats canonical <provider>/<model id> routes matching agent-core qualifiedModel', () => {
		expect(parseModelRoute('openai/gpt-6-luna')).toEqual({ provider: 'openai', id: 'gpt-6-luna' });
		expect(formatModelRoute({ provider: 'openai', id: 'gpt-6-luna' })).toBe('openai/gpt-6-luna');

		expect(parseModelRoute('openrouter/google/gemini-2.5-flash')).toEqual({
			provider: 'openrouter',
			id: 'google/gemini-2.5-flash',
		});
		expect(formatModelRoute({ provider: 'openrouter', id: 'google/gemini-2.5-flash' })).toBe('openrouter/google/gemini-2.5-flash');

		expect(parseModelRoute('openrouter/google/gemini-2.5-flash:free')).toEqual({
			provider: 'openrouter',
			id: 'google/gemini-2.5-flash:free',
		});
		expect(formatModelRoute({ provider: 'openrouter', id: 'google/gemini-2.5-flash:free' })).toBe(
			'openrouter/google/gemini-2.5-flash:free',
		);

		// Legacy provider:id still accepted when `:` precedes any `/`.
		expect(parseModelRoute('openrouter:openai/gpt-4o-mini')).toEqual({
			provider: 'openrouter',
			id: 'openai/gpt-4o-mini',
		});

		expect(() => parseModelRoute('/openai/gpt-6-luna')).toThrow('route-invalid');
		expect(() => parseModelRoute('openai/')).toThrow('route-invalid');
		expect(() => parseModelRoute('openai/google/')).toThrow('route-invalid');
		expect(() => parseModelRoute(':gpt-6-luna')).toThrow('route-invalid');
		expect(() => parseModelRoute('openai:')).toThrow('route-invalid');
		expect(() => parseModelRoute('openrouter/google/gemini:')).toThrow('route-invalid');
		expect(() => parseModelRoute('openrouter//gpt-4o')).toThrow('route-invalid');
		expect(() => parseModelRoute('openrouter/:free')).toThrow('route-invalid');
		expect(() => parseModelRoute('openrouter:/gpt-4o')).toThrow('route-invalid');
	});
});
