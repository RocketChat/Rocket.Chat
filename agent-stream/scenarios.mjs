// The shared scenarios of the plan, section 5. Hypotheses must not change them.

export const REPLY = { tokens: 1000, tokensPerSecond: 40 };

const range = (from, count) => Array.from({ length: count }, (_, i) => from + i);

/**
 * Each scenario maps the seeded users and rooms to `streams`: the rooms that get a reply, each with the users that
 * watch it. An idle scenario opens the rooms and starts no reply.
 */
export const SCENARIOS = {
	S1: {
		purpose: 'latency floor',
		streams: (seed) => [{ rid: seed.rooms.s1, viewers: [seed.users[0]] }],
	},
	S2: {
		purpose: 'fan-out to a large room',
		streams: (seed) => [{ rid: seed.rooms.s2, viewers: range(0, 500).map((i) => seed.users[i]) }],
	},
	S3: {
		purpose: 'many small rooms, as in DMs',
		streams: (seed) => seed.rooms.s3.map((rid, i) => ({ rid, viewers: [seed.users[2 * i], seed.users[2 * i + 1]] })),
	},
	S4: {
		purpose: 'standing cost of the mechanism',
		idle: true,
		idleMs: 25_000,
		streams: (seed) => [{ rid: seed.rooms.s4, viewers: range(0, 1000).map((i) => seed.users[i]) }],
	},
	S5: {
		purpose: 'resume and snapshot correctness',
		reconnect: { everyMs: 10_000, fraction: 0.1 },
		streams: (seed) => seed.rooms.s3.map((rid, i) => ({ rid, viewers: [seed.users[2 * i], seed.users[2 * i + 1]] })),
	},
};

/** The users and rooms the seed script creates, enough for every scenario. */
export const SEED = { users: 1000, s2Members: 500, s3Rooms: 100, s4Members: 1000 };
