// src/core/timers.test.ts
import { describe, it, expect } from 'vitest';
import { defer, deferrable } from './timers';

describe('Meteor Timers', () => {
  it('defer executes asynchronously', () => {
    return new Promise<void>((resolve) => {
      let x = "a";
      defer(() => {
        expect(x).toBe("b");
        resolve();
      });
      x = "b";
    });
  });

  it('nested defer executes in order', () => {
    return new Promise<void>((resolve) => {
      let x = "a";
      defer(() => {
        expect(x).toBe("b");
        defer(() => {
          expect(x).toBe("c");
          resolve();
        });
        x = "c";
      });
      x = "b";
    });
  });

  it('deferrable executes asynchronously if in current env', () => {
    return new Promise<void>((resolve) => {
      let x = "a";
      deferrable(
        () => {
          expect(x).toBe("b");
          resolve();
        },
        { on: ["development", "production", "test"] } // test environment should trigger defer
      );
      x = "b";
    });
  });

  it('deferrable executes synchronously if not in current env', () => {
    let x = "a";
    deferrable(
      () => {
        x = "b";
      },
      { on: [] } // Empty array means it skips defer and runs sync
    );
    expect(x).toBe("b");
  });

  it('deferrable works with async functions', () => {
    return new Promise<void>((resolve) => {
      const x = deferrable(
        () => "start value",
        { on: [] }
      );
      expect(x).toBe("start value");

      deferrable(
        () => {
          resolve();
        },
        { on: ["development", "production", "test"] }
      );
    });
  });
});