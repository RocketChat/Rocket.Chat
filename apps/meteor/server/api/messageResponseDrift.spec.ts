/**
 * Regression harness for issue #42086 — "Response schemas are open (typia): API returns
 * undeclared fields (type drift)".
 *
 * WHY THIS EXISTS
 * ---------------
 * REST response validation only runs under test (see packages/http-router/src/Router.ts),
 * and it passes today for the wrong reason: typia 9.7.2 emits OPEN object schemas (no
 * `additionalProperties: false`), so AJV silently accepts fields the TypeScript types never
 * declared. When typia moves to CLOSED schemas, the server's own responses would start failing.
 *
 * This spec locks in the message-cluster reconciliation WITHOUT a running server or Mongo:
 * it takes the typia-generated schemas, forces their TOP-LEVEL object closed (where all the
 * reconciled fields live), and asserts that the realistic wire-format payloads the chat.*
 * endpoints return validate with no undeclared ROOT fields. Nested/$ref subschemas are left as
 * generated — typia will close those itself once it ships closed schemas.
 *
 * Fixes covered (all green):
 *   - editedAt / editedBy: added to the base IMessage type.
 *   - score: chat.search results are IMessageSearchResult (IMessage + optional score).
 *   - parseUrls: stripped in sendMessage before persist, so it is not part of the message
 *     shape at all — asserted here as "not a declared IMessage field", enforced at runtime.
 */
import { schemas } from '@rocket.chat/core-typings';
import { ajv } from '@rocket.chat/rest-typings';
import type { ValidateFunction } from 'ajv';

type JsonSchema = Record<string, any>;

const components: Record<string, JsonSchema> = (schemas as any).components?.schemas ?? {};

/** Register every typia-generated component so `$ref`s resolve (mirrors server/api/validation/ajv.ts). */
function registerComponents(): void {
	for (const key of Object.keys(components)) {
		const uri = `#/components/schemas/${key}`;
		if (!ajv.getSchema(uri)) {
			ajv.addSchema(components[key], uri);
		}
	}
}

/** Copy of Router.ts's wire coercion: Dates become ISO strings before validation. */
function coerceDatesToStrings(obj: unknown): unknown {
	if (Array.isArray(obj)) {
		return obj.map(coerceDatesToStrings);
	}
	if (obj && typeof obj === 'object') {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(obj)) {
			out[k] = v instanceof Date ? v.toISOString() : coerceDatesToStrings(v);
		}
		return out;
	}
	return obj;
}

/** Compile a CLOSED clone of a top-level component schema (rejects undeclared root fields). */
function closedValidator(component: string): ValidateFunction {
	const closed: JsonSchema = structuredClone(components[component]);
	closed.additionalProperties = false;
	return ajv.compile(closed);
}

/** Property names AJV rejected as additionalProperties at the root. */
function leakedFields(validate: ValidateFunction): string[] {
	return (validate.errors ?? [])
		.filter((e) => e.keyword === 'additionalProperties' && e.instancePath === '')
		.map((e) => String((e.params as any).additionalProperty))
		.sort();
}

// Minimally-valid IMessage in wire form. Required: _id, _updatedAt, rid, msg, ts, u{_id, username}.
const baseMessage = {
	_id: 'msg-1',
	_updatedAt: '2026-01-01T00:00:00.000Z',
	rid: 'room-1',
	msg: 'hello world',
	ts: '2026-01-01T00:00:00.000Z',
	u: { _id: 'user-1', username: 'alice' },
};

describe('message response schema drift (#42086)', () => {
	beforeAll(() => {
		registerComponents();
	});

	it('a minimal IMessage validates against the generated schema', () => {
		const validate = ajv.compile(structuredClone(components.IMessage));
		validate(coerceDatesToStrings(baseMessage));
		expect(validate.errors ?? []).toEqual([]);
	});

	it('an edited message validates fully against a closed IMessage (editedAt/editedBy added to base)', () => {
		const validate = closedValidator('IMessage');
		const edited = { ...baseMessage, editedAt: '2026-01-02T00:00:00.000Z', editedBy: { _id: 'user-2', username: 'bob' } };
		const ok = validate(coerceDatesToStrings(edited));
		// Assert the FULL error list (not just the root additionalProperties slice) so a missing or
		// mistyped field — e.g. a malformed editedBy — also fails the guard instead of passing silently.
		expect(validate.errors ?? []).toEqual([]);
		expect(ok).toBe(true);
	});

	it('a search hit with a relevance score validates fully against a closed IMessageSearchResult (survives schema closing)', () => {
		const validate = closedValidator('IMessageSearchResult');
		const hit = { ...baseMessage, score: 3.14 };
		const ok = validate(coerceDatesToStrings(hit));
		expect(validate.errors ?? []).toEqual([]);
		expect(ok).toBe(true);
	});

	it('parseUrls is not a declared IMessage field, so it must be stripped before persist (sendMessage)', () => {
		// This documents the reason for the runtime strip in sendMessage: parseUrls has no place in
		// the message schema, so any persisted/returned message carrying it would fail a closed schema.
		expect(components.IMessage.properties.parseUrls).toBeUndefined();
		const validate = closedValidator('IMessage');
		validate(coerceDatesToStrings({ ...baseMessage, parseUrls: true }));
		expect(leakedFields(validate)).toEqual(['parseUrls']);
	});
});
