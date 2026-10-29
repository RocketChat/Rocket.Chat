let counter = 0;

/**
 * Returns an id unique within the test run, stable across runs, so fixtures and snapshots stay deterministic.
 */
export const nextFixtureId = (prefix: string) => {
	counter += 1;
	return `${prefix}-${counter.toString().padStart(6, '0')}`;
};

export const FIXTURE_EPOCH = new Date('2024-01-15T12:00:00.000Z');
