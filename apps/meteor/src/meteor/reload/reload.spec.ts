import { describe, it, expect } from 'vitest';
import { Reload } from 'meteor/reload';

describe('reload - migrate', () => {
    it('should appropriately handle migration capabilities and data serialization', () => {
        Reload._withFreshProvidersForTest(() => {
            let readyStateMigration1 = false;

            Reload._onMigrate('reload test data 1', (_tryReload, _options) => {
                return [readyStateMigration1, { foo: 'bar' }];
            });

            Reload._onMigrate('reload test data 2', (_tryReload, _options) => {
                return [true, { baz: 'bar' }];
            });

            // When one provider returns false, no migration data should be stored.
            expect(Reload._migrate(() => { })).toBe(false);
            expect(Reload._getData()).toBeFalsy();

            // If an immediate migration is happening, it shouldn't matter if one provider returns false.
            expect(Reload._migrate(() => { }, { immediateMigration: true })).toBe(true);

            const rawImmediateData = Reload._getData();
            expect(rawImmediateData).toBeTruthy();

            const immediateData = JSON.parse(rawImmediateData as string);
            expect(immediateData.data['reload test data 1']).toEqual({ foo: 'bar' });
            expect(immediateData.data['reload test data 2']).toEqual({ baz: 'bar' });
            expect(immediateData.reload).toBe(true);

            // Now all providers are ready.
            readyStateMigration1 = true;
            expect(Reload._migrate(() => { })).toBe(true);

            const rawFinalData = Reload._getData();
            expect(rawFinalData).toBeTruthy();

            const finalData = JSON.parse(rawFinalData as string);
            expect(finalData.data['reload test data 1']).toEqual({ foo: 'bar' });
            expect(finalData.data['reload test data 2']).toEqual({ baz: 'bar' });
            expect(finalData.reload).toBe(true);
        });
    });
});