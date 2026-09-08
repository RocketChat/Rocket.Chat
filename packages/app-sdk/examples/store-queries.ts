/**
 * Worked example for the store (rfc/18-surface-store.md).
 *
 * Every `@ts-expect-error` below is an assertion: the file only compiles if the
 * index contract holds. If `find` ever widened back to `Partial<T>` — accepting
 * any field, indexed or not — those lines would stop erroring and this example
 * would fail to type-check.
 */

import type { AppContext, InferStore } from '@rocket.chat/app-sdk';
import { defineStore } from '@rocket.chat/app-sdk';
import { z } from 'zod';

export const store = defineStore({
	reminders: {
		schema: z.object({
			userId: z.string(),
			roomId: z.string(),
			dueAt: z.string(),
			text: z.string(),
			expiresAt: z.date(),
		}),
		indexes: [
			{ on: ['userId', 'dueAt'] },
			{ on: 'roomId', unique: true },
			{ on: 'expiresAt', ttl: '7d' },
		],
	},
	// A collection with no indexes: `get` and an unfiltered page, nothing else.
	audit: {
		schema: z.object({ action: z.string(), at: z.date() }),
	},
});

type Env = { settings: Record<string, never>; store: InferStore<typeof store> };

declare const ctx: AppContext<Env>;
declare function sink(...values: unknown[]): void;

/* ------------------------------------------------------------------ *
 * 1. A declared index serves its own prefixes, and nothing else.
 * ------------------------------------------------------------------ */

export async function servedQueries(userId: string, roomId: string): Promise<void> {
	sink(await ctx.store.reminders.find({ userId })); // the first key alone
	sink(await ctx.store.reminders.find({ userId, dueAt: 'now' })); // the whole key
	sink(await ctx.store.reminders.find({ roomId })); // a single-field index
	sink(await ctx.store.reminders.find()); // an unfiltered page

	// @ts-expect-error no index starts with dueAt
	sink(await ctx.store.reminders.find({ dueAt: 'now' }));

	// @ts-expect-error text is in the record but in no index
	sink(await ctx.store.reminders.find({ text: 'hi' }));

	// @ts-expect-error userId is indexed, text is not
	sink(await ctx.store.reminders.find({ userId, text: 'hi' }));

	// @ts-expect-error not a field of the record at all
	sink(await ctx.store.reminders.find({ nope: 1 }));

	// @ts-expect-error dueAt is a string in the schema
	sink(await ctx.store.reminders.find({ userId, dueAt: 42 }));
}

/* ------------------------------------------------------------------ *
 * 2. No indexes, no filter.
 * ------------------------------------------------------------------ */

export async function unindexedCollection(): Promise<void> {
	sink(await ctx.store.audit.find());
	sink(await ctx.store.audit.get('id'));

	// @ts-expect-error the collection declares no index, so it answers no filter
	sink(await ctx.store.audit.find({ action: 'install' }));
}

/* ------------------------------------------------------------------ *
 * 3. The record type flows through the read.
 * ------------------------------------------------------------------ */

export async function typedReads(userId: string): Promise<void> {
	const [reminder] = await ctx.store.reminders.find({ userId });
	if (!reminder) {
		return;
	}
	sink(reminder._id, reminder.text, reminder.expiresAt.getTime());

	// @ts-expect-error the record has no such field
	sink(reminder.delivered);

	await ctx.store.reminders.update(reminder._id, { text: 'later' });

	// @ts-expect-error a patch is checked field by field
	await ctx.store.reminders.update(reminder._id, { dueAt: 42 });
}

/* ------------------------------------------------------------------ *
 * 4. The declaration checks its own index keys.
 * ------------------------------------------------------------------ */

export const rejected = defineStore({
	things: {
		schema: z.object({ label: z.string() }),
		// @ts-expect-error an index on a field the schema does not declare
		indexes: [{ on: 'nope' }],
	},
});

export const rejectedTtl = defineStore({
	things: {
		schema: z.object({ at: z.string() }),
		// @ts-expect-error a TTL index needs a Date field; MongoDB expires dates, not strings
		indexes: [{ on: 'at', ttl: '7d' }],
	},
});
