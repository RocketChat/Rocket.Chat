import { SpifError, UnknownPolicyError } from '../errors';
import { PolicyRegistry } from './PolicyRegistry';
import { exerciseSpif } from '../fixtures/exercisePolicy';

const otherSpif = exerciseSpif.replace('name="EXERCISE" id="2.999.1"', 'name="OTHER" id="2.999.2"');

describe('PolicyRegistry', () => {
	it('looks policies up by OID', () => {
		const registry = new PolicyRegistry();
		registry.load(exerciseSpif);

		expect(registry.get('2.999.1').name).toBe('EXERCISE');
		expect(registry.find('2.999.2')).toBeUndefined();
		expect(() => registry.get('2.999.2')).toThrow(UnknownPolicyError);
	});

	it('replaces an earlier version of the same policy', () => {
		const registry = new PolicyRegistry();
		registry.load(exerciseSpif);
		registry.load(exerciseSpif.replace('version="3"', 'version="4"'));

		expect(registry.list().map(({ version }) => version)).toEqual(['4']);
	});

	it('keeps the previous policies when a reload fails', () => {
		const registry = new PolicyRegistry();
		registry.replaceAll([exerciseSpif]);

		expect(() => registry.replaceAll([otherSpif, '<broken'])).toThrow(SpifError);
		expect(registry.list().map(({ id }) => id)).toEqual(['2.999.1']);

		registry.replaceAll([otherSpif]);
		expect(registry.list().map(({ id }) => id)).toEqual(['2.999.2']);
	});
});
