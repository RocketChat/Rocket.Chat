import { describe, it, expect, vi } from 'vitest';
import { Tracker } from 'meteor/tracker';

describe('Tracker', () => {
  it('run', () => {
    const d = new Tracker.Dependency();
    let x = 0;
    
    const handle = Tracker.autorun(() => {
      d.depend();
      ++x;
    });
    
    expect(x).toBe(1);
    Tracker.flush();
    expect(x).toBe(1);
    
    d.changed();
    expect(x).toBe(1);
    Tracker.flush();
    expect(x).toBe(2);
    
    d.changed();
    expect(x).toBe(2);
    Tracker.flush();
    expect(x).toBe(3);
    
    d.changed();
    handle.stop();
    Tracker.flush();
    expect(x).toBe(3);
    
    d.changed();
    Tracker.flush();
    expect(x).toBe(3);

    Tracker.autorun((internalHandle) => {
      d.depend();
      ++x;
      if (x === 6) internalHandle.stop();
    });
    
    expect(x).toBe(4);
    d.changed();
    Tracker.flush();
    expect(x).toBe(5);
    
    d.changed();
    Tracker.flush();
    expect(x).toBe(6);
    
    d.changed();
    Tracker.flush();
    expect(x).toBe(6);

    expect(() => Tracker.autorun(undefined as any)).toThrow();
    expect(() => Tracker.autorun({} as any)).toThrow();
  });

  it('nested run', () => {
    const a = new Tracker.Dependency();
    const b = new Tracker.Dependency();
    const c = new Tracker.Dependency();
    const d = new Tracker.Dependency();
    const e = new Tracker.Dependency();
    const f = new Tracker.Dependency();

    let buf = "";

    Tracker.autorun(() => {
      a.depend();
      buf += 'a';
      Tracker.autorun(() => {
        b.depend();
        buf += 'b';
        Tracker.autorun(() => {
          c.depend();
          buf += 'c';
          const c2 = Tracker.autorun(() => {
            d.depend();
            buf += 'd';
            Tracker.autorun(() => {
              e.depend();
              buf += 'e';
              Tracker.autorun(() => {
                f.depend();
                buf += 'f';
              });
            });
            Tracker.onInvalidate(() => c2.stop());
          });
        });
      });
      Tracker.onInvalidate((comp) => comp.stop());
    });

    const expectBuf = (str: string) => {
      expect(buf).toBe(str);
      buf = "";
    };

    expectBuf('abcdef');
    expect(a.hasDependents()).toBe(true);
    expect(b.hasDependents()).toBe(true);
    expect(c.hasDependents()).toBe(true);
    expect(d.hasDependents()).toBe(true);
    expect(e.hasDependents()).toBe(true);
    expect(f.hasDependents()).toBe(true);

    b.changed();
    expectBuf('');
    Tracker.flush();
    expectBuf('bcdef');

    c.changed();
    Tracker.flush();
    expectBuf('cdef');

    const changeAndExpect = (v: Tracker.Dependency, str: string) => {
      v.changed();
      Tracker.flush();
      expectBuf(str);
    };

    changeAndExpect(e, 'ef');
    changeAndExpect(f, 'f');
    changeAndExpect(d, '');
    changeAndExpect(e, '');
    changeAndExpect(f, '');

    expect(a.hasDependents()).toBe(true);
    expect(b.hasDependents()).toBe(true);
    expect(c.hasDependents()).toBe(true);
    expect(d.hasDependents()).toBe(false);
    expect(e.hasDependents()).toBe(false);
    expect(f.hasDependents()).toBe(false);

    changeAndExpect(c, 'cdef');
    changeAndExpect(e, 'ef');
    changeAndExpect(f, 'f');
    
    changeAndExpect(b, 'bcdef');
    changeAndExpect(e, 'ef');
    changeAndExpect(f, 'f');

    a.changed();
    changeAndExpect(f, '');
    changeAndExpect(e, '');
    changeAndExpect(d, '');
    changeAndExpect(c, '');
    changeAndExpect(b, '');
    changeAndExpect(a, '');

    expect(a.hasDependents()).toBe(false);
    expect(b.hasDependents()).toBe(false);
  });

  it('flush', () => {
    let buf = "";

    const c1 = Tracker.autorun((c) => {
      buf += 'a';
      if (c.firstRun) c.invalidate();
    });

    expect(buf).toBe('a');
    Tracker.flush();
    expect(buf).toBe('aa');
    Tracker.flush();
    expect(buf).toBe('aa');
    c1.stop();
    Tracker.flush();
    expect(buf).toBe('aa');

    buf = "";
    const c2 = Tracker.autorun((c) => {
      buf += 'a';
      if (c.firstRun) c.invalidate();
      Tracker.onInvalidate(() => { buf += "*"; });
    });

    expect(buf).toBe('a*');
    Tracker.flush();
    expect(buf).toBe('a*a');
    c2.stop();
    expect(buf).toBe('a*a*');
    Tracker.flush();
    expect(buf).toBe('a*a*');

    buf = "";
    const c3 = Tracker.autorun((c) => {
      buf += 'a';
      if (c.firstRun) c.invalidate();
      Tracker.afterFlush(() => {
        buf += (Tracker.active ? "1" : "0");
      });
    });

    Tracker.afterFlush(() => { buf += 'c'; });

    let c4!: Tracker.Computation;
    Tracker.autorun((c) => {
      c4 = c;
      buf += 'b';
    });

    Tracker.flush();
    expect(buf).toBe('aba0c0');
    c3.stop();
    c4.stop();
    Tracker.flush();

    let ran = false;
    Tracker.afterFlush((...args) => {
      ran = true;
      expect(args.length).toBe(0);
      expect(() => Tracker.flush()).toThrow();
    });

    Tracker.flush();
    expect(ran).toBe(true);

    expect(() => Tracker.autorun(() => Tracker.flush())).toThrow();
    expect(() => Tracker.autorun(() => {
      Tracker.autorun(() => {});
      Tracker.flush();
    })).toThrow();
  });

  it('lifecycle', () => {
    expect(Tracker.active).toBe(false);
    expect(Tracker.currentComputation).toBeNull();

    let runCount = 0;
    let firstRun = true;
    const buf: number[] = [];
    let cbId = 1;
    
    const makeCb = () => {
      const id = cbId++;
      return () => { buf.push(id); };
    };

    let shouldStop = false;

    const c1 = Tracker.autorun((c) => {
      expect(Tracker.active).toBe(true);
      expect(Tracker.currentComputation).toBe(c);
      expect(c.stopped).toBe(false);
      expect(c.invalidated).toBe(false);
      expect(c.firstRun).toBe(firstRun);

      Tracker.onInvalidate(makeCb());
      Tracker.afterFlush(makeCb());

      Tracker.autorun((x) => {
        x.stop();
        c.onInvalidate(makeCb());
        Tracker.onInvalidate(makeCb());
        Tracker.afterFlush(makeCb());
      });
      runCount++;

      if (shouldStop) c.stop();
    });

    firstRun = false;
    expect(runCount).toBe(1);
    expect(buf).toEqual([4]);
    
    c1.invalidate();
    expect(runCount).toBe(1);
    expect(c1.invalidated).toBe(true);
    expect(c1.stopped).toBe(false);
    expect(buf).toEqual([4, 1, 3]);

    Tracker.flush();
    expect(runCount).toBe(2);
    expect(c1.invalidated).toBe(false);
    expect(buf).toEqual([4, 1, 3, 9, 2, 5, 7, 10]);

    buf.length = 0;
    shouldStop = true;
    c1.invalidate();
    expect(buf).toEqual([6, 8]);
    Tracker.flush();
    expect(buf).toEqual([6, 8, 14, 11, 13, 12, 15]);
  });

  it('throwFirstError', () => {
    const d = new Tracker.Dependency();
    Tracker.autorun((c) => {
      d.depend();
      if (!c.firstRun) throw new Error("foo");
    });

    d.changed();
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    Tracker.flush();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();

    d.changed();
    expect(() => {
      Tracker.flush({ _throwFirstError: true });
    }).toThrow(/foo/);
  });

  it('no infinite recomputation', () => {
    return new Promise<void>((resolve) => {
      let reran = false;
      const c = Tracker.autorun((comp) => {
        if (!comp.firstRun) reran = true;
        comp.invalidate();
      });
      expect(reran).toBe(false);

      setTimeout(() => {
        c.stop();
        Tracker.afterFlush(() => {
          expect(reran).toBe(true);
          expect(c.stopped).toBe(true);
          resolve();
        });
      }, 50);
    });
  });

  it('Tracker.flush finishes', () => {
    let n = 0;
    Tracker.autorun((c) => {
      if (++n < 2000) c.invalidate();
    });
    expect(n).toBe(1);
    Tracker.flush();
    expect(n).toBe(2000);
  });

  it('Tracker.autorun, onError option', () => {
    const d = new Tracker.Dependency();
    let caughtError: unknown | null = null;
    
    Tracker.autorun((c) => {
      d.depend();
      if (!c.firstRun) throw new Error("foo");
    }, {
      onError: (err) => { caughtError = err; }
    });

    d.changed();
    Tracker.flush();
    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toBe("foo");
  });

  it('async function - basics', async () => {
    const promise = new Promise<void>((resolve) => {
      const computation = Tracker.autorun(async (c) => {
        expect(c.firstRun).toBe(true);
        expect(Tracker.currentComputation).toBe(c);
        
        const x = await Promise.resolve().then(() =>
          Tracker.withComputation(c, () => {
            expect(c.firstRun).toBe(false);
            expect(Tracker.currentComputation).toBe(c);
            return 123;
          })
        );
        
        expect(x).toBe(123);
        expect(c.firstRun).toBe(false);
        
        Tracker.withComputation(c, () => {
          expect(Tracker.currentComputation).toBe(c);
        });
        
        await new Promise(r => setTimeout(r, 10));
        
        Tracker.withComputation(c, () => {
          expect(c.firstRun).toBe(false);
          expect(Tracker.currentComputation).toBe(c);
        });
        
        try {
          await Promise.reject('example');
          expect.fail();
        } catch (error) {
          Tracker.withComputation(c, () => {
            expect(error).toBe('example');
            expect(c.firstRun).toBe(false);
            expect(Tracker.currentComputation).toBe(c);
          });
        }
        resolve();
      });
      
      expect(Tracker.currentComputation).toBeNull();
      expect(computation).toBeInstanceOf(Tracker.Computation);
    });

    await promise;
  });

  it('async function - parallel', async () => {
    let resolvePromise!: () => void;
    const promise = new Promise<void>(resolve => { resolvePromise = resolve; });

    let count = 0;
    const limit = 10;
    const dependency = new Tracker.Dependency();
    
    for (let index = 0; index < limit; ++index) {
      Tracker.autorun(async (c) => {
        count++;
        Tracker.withComputation(c, () => dependency.depend());
        await promise;
        count--;
      });
    }

    expect(count).toBe(limit);
    dependency.changed();
    await new Promise(r => setTimeout(r, 10));
    expect(count).toBe(limit * 2);
    
    resolvePromise();
    await new Promise(r => setTimeout(r, 10));
    expect(count).toBe(0);
  });
});