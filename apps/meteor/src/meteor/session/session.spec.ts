import { describe, it, expect } from 'vitest';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';

// Mock MongoDB ObjectID to test duck-typed equality
class MockObjectID {
    private id: string;
    constructor(id: string) {
        this.id = id;
    }
    toHexString() {
        return this.id;
    }
}

describe('Session', () => {
    it('setDefault works as expected', () => {
        Session.setDefault('def', 'argyle');
        expect(Session.get('def')).toBe('argyle');

        Session.set('def', 'noodle');
        expect(Session.get('def')).toBe('noodle');

        Session.set('nondef', 'potato');
        expect(Session.get('nondef')).toBe('potato');

        Session.setDefault('nondef', 'eggs');
        expect(Session.get('nondef')).toBe('potato');

        // Cleanup for next tests
        Session.delete('def');
        Session.delete('nondef');
    });

    it('handles get/set/equals for various types', () => {
        // Undefined
        expect(Session.get('u')).toBeUndefined();
        expect(Session.equals('u', undefined)).toBe(true);
        expect(Session.equals('u', null)).toBe(false);
        expect(Session.equals('u', 0)).toBe(false);
        expect(Session.equals('u', '')).toBe(false);

        Session.set('u', undefined);
        expect(Session.get('u')).toBeUndefined();
        expect(Session.equals('u', undefined)).toBe(true);
        expect(Session.equals('u', 'undefined')).toBe(false);

        // Null
        Session.set('n', null);
        expect(Session.get('n')).toBeNull();
        expect(Session.equals('n', undefined)).toBe(false);
        expect(Session.equals('n', null)).toBe(true);

        // Booleans
        Session.set('t', true);
        expect(Session.get('t')).toBe(true);
        expect(Session.equals('t', true)).toBe(true);
        expect(Session.equals('t', false)).toBe(false);
        expect(Session.equals('t', 'true')).toBe(false);

        Session.set('f', false);
        expect(Session.get('f')).toBe(false);
        expect(Session.equals('f', false)).toBe(true);
        expect(Session.equals('f', true)).toBe(false);

        // Numbers
        Session.set('num', 0);
        expect(Session.get('num')).toBe(0);
        expect(Session.equals('num', 0)).toBe(true);
        expect(Session.equals('num', '0')).toBe(false);

        // Strings
        Session.set('str', 'true');
        expect(Session.get('str')).toBe('true');
        expect(Session.equals('str', 'true')).toBe(true);
        expect(Session.equals('str', true)).toBe(false);

        // Arrays
        Session.set('arr', [1, 2, { a: 1, b: [5, 6] }]);
        expect(Session.get('arr')).toEqual([1, 2, { b: [5, 6], a: 1 }]);
        expect(Session.equals('arr', 1)).toBe(false);
        expect(() => Session.equals('arr', [1, 2, { a: 1, b: [5, 6] }])).toThrow();

        // Objects
        Session.set('obj', { a: 1, b: [5, 6] });
        expect(Session.get('obj')).toEqual({ b: [5, 6], a: 1 });
        expect(Session.equals('obj', 1)).toBe(false);
        expect(() => Session.equals('obj', { a: 1, b: [5, 6] })).toThrow();

        // Dates
        Session.set('date', new Date(1234));
        expect(Session.get('date')).toEqual(new Date(1234));
        expect(Session.equals('date', new Date(3455))).toBe(false);
        expect(Session.equals('date', new Date(1234))).toBe(true);

        // Mock ObjectIDs (testing duck typed toHexString)
        Session.set('oid', new MockObjectID('ffffffffffffffffffffffff'));
        expect(Session.get('oid')).toEqual(new MockObjectID('ffffffffffffffffffffffff'));
        expect(Session.equals('oid', new MockObjectID('fffffffffffffffffffffffa'))).toBe(false);
        expect(Session.equals('oid', new MockObjectID('ffffffffffffffffffffffff'))).toBe(true);
    });

    it('clones returned objects to prevent mutations', () => {
        Session.set('frozen-array', [1, 2, 3]);
        const arr = Session.get('frozen-array');
        arr[1] = 42;
        expect(Session.get('frozen-array')).toEqual([1, 2, 3]);

        Session.set('frozen-object', { a: 1, b: 2 });
        const obj = Session.get('frozen-object');
        obj.a = 43;
        expect(Session.get('frozen-object')).toEqual({ a: 1, b: 2 });
    });

    it('triggers context invalidation correctly for get()', () => {
        let xGetExecutions = 0;

        Tracker.autorun(() => {
            ++xGetExecutions;
            Session.get('x');
        });

        expect(xGetExecutions).toBe(1);

        Session.set('x', 1);
        expect(xGetExecutions).toBe(1); // Invalidation happens at flush

        Tracker.flush();
        expect(xGetExecutions).toBe(2);

        // Setting same value doesn't re-run
        Session.set('x', 1);
        Tracker.flush();
        expect(xGetExecutions).toBe(2);

        Session.set('x', '1');
        Tracker.flush();
        expect(xGetExecutions).toBe(3);
    });

    it('triggers context invalidation correctly for equals()', () => {
        let xEqualsExecutions = 0;

        Tracker.autorun(() => {
            ++xEqualsExecutions;
            Session.equals('y-eq', 5);
        });

        expect(xEqualsExecutions).toBe(1);

        Session.set('y-eq', 1);
        Tracker.flush();
        expect(xEqualsExecutions).toBe(1); // Changing undefined -> 1 shouldn't affect equals(5)

        Session.set('y-eq', 5);
        expect(xEqualsExecutions).toBe(1);

        Tracker.flush();
        expect(xEqualsExecutions).toBe(2);

        Session.set('y-eq', 5);
        Tracker.flush();
        expect(xEqualsExecutions).toBe(2); // Same value = no rerun

        Session.set('y-eq', '5');
        Tracker.flush();
        expect(xEqualsExecutions).toBe(3);

        Session.set('y-eq', 5);
        Tracker.flush();
        expect(xEqualsExecutions).toBe(4);
    });

    it('triggers context invalidation correctly for equals() with undefined', () => {
        let zEqualsExecutions = 0;

        Tracker.autorun(() => {
            ++zEqualsExecutions;
            Session.equals('z', undefined);
        });

        expect(zEqualsExecutions).toBe(1);

        Session.set('z', undefined);
        Tracker.flush();
        expect(zEqualsExecutions).toBe(1);

        Session.set('z', 5);
        Tracker.flush();
        expect(zEqualsExecutions).toBe(2);

        Session.set('z', 3);
        Tracker.flush();
        expect(zEqualsExecutions).toBe(2);

        Session.set('z', 'undefined');
        Tracker.flush();
        expect(zEqualsExecutions).toBe(2);

        Session.set('z', undefined);
        Tracker.flush();
        expect(zEqualsExecutions).toBe(3);
    });

    it('parses an object of key/value pairs using set()', () => {
        // Tests the modernized object setting fallback implemented in ReactiveDict
        Session.set({ fruit: 'apple', vegetable: 'potato' });

        expect(Session.get('fruit')).toBe('apple');
        expect(Session.get('vegetable')).toBe('potato');

        Session.delete('fruit');
        Session.delete('vegetable');
    });
});