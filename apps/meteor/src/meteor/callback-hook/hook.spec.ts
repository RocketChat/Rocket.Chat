import { describe, it, expect, vi } from 'vitest';
import { Hook } from './hook.ts';

describe('Hook', () => {
  it('registers and executes callbacks maintaining lexical scope closures', () => {
    const hook = new Hook<() => void>();
    let executionValue = '';

    hook.register(() => {
      executionValue = "invoked";
    });

    hook.forEach((callback) => {
      callback();
      return true; // continue iteration
    });

    expect(executionValue).toBe('invoked');
  });

  it('unhandled exceptions propagate up by default', () => {
    const hook = new Hook<() => void>();
    
    hook.register(() => {
      throw new Error("Test error");
    });

    expect(() => {
      hook.forEach((callback) => {
        callback();
        return true;
      });
    }).toThrow("Test error");
  });

  it('exceptionHandler intercepts exceptions', () => {
    const exToThrow = new Error("Test error");
    let thrownEx: unknown = null;
    
    const hook = new Hook<() => void>({
      exceptionHandler: (ex) => { thrownEx = ex; }
    });

    hook.register(() => {
      throw exToThrow;
    });

    hook.each((callback) => {
      callback();
      return true;
    });

    expect(thrownEx).toBe(exToThrow);
  });

  it('debugPrintExceptions intercepts exceptions and logs to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exToThrow = new Error("Test error");
    
    const hook = new Hook<() => void>({
      debugPrintExceptions: "Test Hook Iteration"
    });

    hook.register(() => {
      throw exToThrow;
    });

    hook.forEach((callback) => {
      callback();
      return true;
    });

    expect(consoleSpy).toHaveBeenCalledWith("Exception in Test Hook Iteration", exToThrow);
    consoleSpy.mockRestore();
  });

  it('stops execution if a callback is unregistered during iteration', () => {
    const hook = new Hook<() => void>();
    const executed: number[] = [];

    const handle1 = hook.register(() => executed.push(1));
    hook.register(() => executed.push(2));
    
    hook.forEach((callback) => {
      callback();
      handle1.stop(); // Remove a handler mid-iteration
      return true;
    });

    expect(executed).toEqual([1, 2]);
    expect(Object.keys(hook['callbacks'])).toHaveLength(1); // Only second callback remains
  });
});