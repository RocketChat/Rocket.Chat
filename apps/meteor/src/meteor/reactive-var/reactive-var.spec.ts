import { describe, it, expect, vi } from 'vitest';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

describe('ReactiveVar', () => {
    it('should hold a value and be reactive', () => {
        const rv = new ReactiveVar(10);
        let result = 0;

        Tracker.autorun(() => {
            result = rv.get();
        });

        expect(result).toBe(10);
        rv.set(20);

        // Ensure Tracker flushes synchronously if your implementation requires it
        Tracker.flush();
        expect(result).toBe(20);
    });

    it('should not invalidate if value is the same primitive', () => {
        const rv = new ReactiveVar('test');
        const spy = vi.fn();

        Tracker.autorun(() => {
            rv.get();
            spy();
        });

        rv.set('test');
        Tracker.flush();
        expect(spy).toHaveBeenCalledTimes(1); // Should not re-run
    });

    it('should always invalidate for objects by default', () => {
        const obj = { a: 1 };
        const rv = new ReactiveVar(obj);
        const spy = vi.fn();

        Tracker.autorun(() => {
            rv.get();
            spy();
        });

        rv.set(obj); // Same reference
        Tracker.flush();
        expect(spy).toHaveBeenCalledTimes(2); // Should re-run due to conservative check
    });
});