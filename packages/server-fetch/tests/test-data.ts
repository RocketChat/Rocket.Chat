export const validHeaders = [
	{
		raw: 'Digest realm="api.example.com", nonce="abc123"',
		parsed: { schema: 'Digest', realm: 'api.example.com', nonce: 'abc123' },
		response:
			'Digest username="user", realm="api.example.com", nonce="abc123", uri="/api/resource", algorithm=MD5, response="MD5[MD5[user:api.example.com:pass]:abc123:MD5[POST:/api/resource]]"',
	},
	{
		raw: 'Digest realm="api.example.com", nonce="abc123", qop="auth,auth-int", opaque="xyz789", algorithm="MD5"',
		parsed: { schema: 'Digest', realm: 'api.example.com', nonce: 'abc123', qop: ['auth', 'auth-int'], opaque: 'xyz789', algorithm: 'MD5' },
		response:
			'Digest username="user", realm="api.example.com", nonce="abc123", uri="/api/resource", algorithm=MD5, qop=auth, nc=00000001, cnonce="0102030405060708", response="MD5[MD5[user:api.example.com:pass]:abc123:00000001:0102030405060708:auth:MD5[POST:/api/resource]]", opaque="xyz789"',
	},
	{
		raw: 'Digest realm="api.example.com", nonce="abc123", qop="auth, auth-int", opaque="xyz789", algorithm=MD5',
		parsed: { schema: 'Digest', realm: 'api.example.com', nonce: 'abc123', qop: ['auth', 'auth-int'], opaque: 'xyz789', algorithm: 'MD5' },
		response:
			'Digest username="user", realm="api.example.com", nonce="abc123", uri="/api/resource", algorithm=MD5, qop=auth, nc=00000001, cnonce="0102030405060708", response="MD5[MD5[user:api.example.com:pass]:abc123:00000001:0102030405060708:auth:MD5[POST:/api/resource]]", opaque="xyz789"',
	},
	{
		raw: 'Digest realm="api.example.com", nonce="abc123", qop="auth"',
		parsed: { schema: 'Digest', realm: 'api.example.com', nonce: 'abc123', qop: ['auth'] },
		response:
			'Digest username="user", realm="api.example.com", nonce="abc123", uri="/api/resource", algorithm=MD5, qop=auth, nc=00000001, cnonce="0102030405060708", response="MD5[MD5[user:api.example.com:pass]:abc123:00000001:0102030405060708:auth:MD5[POST:/api/resource]]"',
	},
	{
		raw: 'Digest realm="api.example.com", nonce="abc123", algorithm=SHA-256',
		parsed: { schema: 'Digest', realm: 'api.example.com', nonce: 'abc123', algorithm: 'SHA-256' },
		response:
			'Digest username="user", realm="api.example.com", nonce="abc123", uri="/api/resource", algorithm=SHA-256, response="SHA-256[SHA-256[user:api.example.com:pass]:abc123:SHA-256[POST:/api/resource]]"',
	},
	{
		raw: 'Digest realm="api.example.com", nonce="abc123", algorithm="SHA-256"',
		parsed: { schema: 'Digest', realm: 'api.example.com', nonce: 'abc123', algorithm: 'SHA-256' },
		response:
			'Digest username="user", realm="api.example.com", nonce="abc123", uri="/api/resource", algorithm=SHA-256, response="SHA-256[SHA-256[user:api.example.com:pass]:abc123:SHA-256[POST:/api/resource]]"',
	},
	{
		raw: 'DIGEST realm="api.example.com", nonce="abc123"',
		parsed: { schema: 'Digest', realm: 'api.example.com', nonce: 'abc123' },
		response:
			'Digest username="user", realm="api.example.com", nonce="abc123", uri="/api/resource", algorithm=MD5, response="MD5[MD5[user:api.example.com:pass]:abc123:MD5[POST:/api/resource]]"',
	},

	{
		raw: 'Digest realm="api.example.com", nonce="abc123", qop="auth-int"',
		parsed: { schema: 'Digest', realm: 'api.example.com', nonce: 'abc123', qop: ['auth-int'] },
		response:
			'Digest username="user", realm="api.example.com", nonce="abc123", uri="/api/resource", algorithm=MD5, qop=auth-int, nc=00000001, cnonce="0102030405060708", response="MD5[MD5[user:api.example.com:pass]:abc123:00000001:0102030405060708:auth-int:MD5[POST:/api/resource]]"',
	},

	{
		raw: 'Digest realm="api.example.com", nonce="abc123", algorithm="MD5-sess"',
		parsed: { schema: 'Digest', realm: 'api.example.com', nonce: 'abc123', algorithm: 'MD5-sess' },
		response:
			'Digest username="user", realm="api.example.com", nonce="abc123", uri="/api/resource", algorithm=MD5-sess, response="MD5-sess[MD5-sess[MD5-sess[user:api.example.com:pass]:abc123:0102030405060708]:abc123:MD5-sess[POST:/api/resource]]"',
	},

	{
		raw: 'Digest realm="api.example.com", nonce="abc123", opaque="xyz789"',
		parsed: { schema: 'Digest', realm: 'api.example.com', nonce: 'abc123', opaque: 'xyz789' },
		response:
			'Digest username="user", realm="api.example.com", nonce="abc123", uri="/api/resource", algorithm=MD5, response="MD5[MD5[user:api.example.com:pass]:abc123:MD5[POST:/api/resource]]", opaque="xyz789"',
	},
];

export const unsupportedHeaders = [
	{
		raw: 'Digest realm="api.example.com", nonce="abc123", qop="auth,auth-int", opaque="xyz789", algorithm="SHA-1"',
		parsed: {
			schema: 'Digest',
			realm: 'api.example.com',
			nonce: 'abc123',
			qop: ['auth', 'auth-int'],
			opaque: 'xyz789',
			algorithm: 'SHA-1',
		},
	},
	{
		raw: 'Digest realm="api.example.com", nonce="abc123", qop="auth, auth-int", opaque="xyz789", algorithm=SHA-1',
		parsed: {
			schema: 'Digest',
			realm: 'api.example.com',
			nonce: 'abc123',
			qop: ['auth', 'auth-int'],
			opaque: 'xyz789',
			algorithm: 'SHA-1',
		},
	},
	{
		raw: 'Digest realm="api.example.com", nonce="abc123", algorithm=SHA-1',
		parsed: { schema: 'Digest', realm: 'api.example.com', nonce: 'abc123', algorithm: 'SHA-1' },
	},
];

export const invalidHeaders = [
	{ raw: '' },
	// Invalid schema
	{ raw: 'Bearer token=abc123' },
	// Missing nonce
	{ raw: 'Digest realm="api.example.com"' },
	// Missing realm
	{ raw: 'Digest nonce="abc123"' },
];
