// src/core/helpers.test.ts
import { describe, it, expect } from "vitest";
import { _ensure, _delete, _inherits, promisify } from "./helpers";

describe("Core Helpers", () => {
  describe("_ensure", () => {
    it("should build out object paths safely", () => {
      const x: any = {};
      
      let y = _ensure(x, "a", "b", "c");
      expect(x).toEqual({ a: { b: { c: {} } } });
      expect(y).toEqual({});
      
      y.d = 12;
      expect(x).toEqual({ a: { b: { c: { d: 12 } } } });
      expect(y).toEqual({ d: 12 });

      y = _ensure(x, "a", "b", "c");
      expect(x).toEqual({ a: { b: { c: { d: 12 } } } });
      expect(y).toEqual({ d: 12 });
      
      y.x = 13;
      expect(x).toEqual({ a: { b: { c: { d: 12, x: 13 } } } });
      expect(y).toEqual({ d: 12, x: 13 });

      y = _ensure(x, "a", "n");
      expect(x).toEqual({ a: { b: { c: { d: 12, x: 13 } }, n: {} } });
      expect(y).toEqual({});
      
      y.d = 22;
      expect(x).toEqual({ a: { b: { c: { d: 12, x: 13 } }, n: { d: 22 } } });
      expect(y).toEqual({ d: 22 });

      _ensure(x, "a", "q", "r")["s"] = 99;
      expect(x).toEqual({
        a: { b: { c: { d: 12, x: 13 } }, n: { d: 22 }, q: { r: { s: 99 } } },
      });

      _ensure(x, "b")["z"] = 44;
      expect(x).toEqual({
        a: { b: { c: { d: 12, x: 13 } }, n: { d: 22 }, q: { r: { s: 99 } } },
        b: { z: 44 },
      });
    });
  });

  describe("_delete", () => {
    it("should delete from object paths and clean up empty parents safely", () => {
      let x: any = {};
      _delete(x, "a", "b", "c");
      expect(x).toEqual({});

      x = { a: { b: {} } };
      _delete(x, "a", "b", "c");
      expect(x).toEqual({});

      x = { a: { b: {}, n: {} } };
      _delete(x, "a", "b", "c");
      expect(x).toEqual({ a: { n: {} } });

      x = { a: { b: {} }, n: {} };
      _delete(x, "a", "b", "c");
      expect(x).toEqual({ n: {} });

      x = { a: { b: 99 } };
      _delete(x, "a", "b", "c");
      expect(x).toEqual({});

      x = { a: { b: 99 } };
      _delete(x, "a", "b", "c", "d");
      expect(x).toEqual({});

      x = { a: { b: 99 } };
      _delete(x, "a", "b", "c", "d", "e", "f");
      expect(x).toEqual({});

      x = { a: { b: { c: { d: 99 } } }, x: 12 };
      _delete(x, "a", "b", "c", "d");
      expect(x).toEqual({ x: 12 });

      x = { a: { b: { c: { d: 99 } }, x: 12 } };
      _delete(x, "a", "b", "c", "d");
      expect(x).toEqual({ a: { x: 12 } });

      x = { a: 12, b: 13 };
      _delete(x, "a");
      expect(x).toEqual({ b: 13 });

      x = { a: 12 };
      _delete(x, "a");
      expect(x).toEqual({});
    });
  });

  describe("_inherits", () => {
    it("should setup classical inheritance", () => {
      const Parent = function () {} as any;
      Parent.parentStaticProp = true;
      Parent.prototype.parentProp = true;

      const Child = function () {} as any;
      _inherits(Child, Parent);

      Child.prototype.childProp = true;

      expect(Child.parentStaticProp).toBe(true);
      expect(Child.__super__).toBe(Parent.prototype);

      const c = new Child();
      expect(c.parentProp).toBe(true);
    });
  });

  describe("promisify", () => {
    it("should wrap a callback-style function in a Promise", async () => {
      class TestClass {
        value: number;
        constructor(value: number) {
          this.value = value;
        }

        method(arg1: number, arg2: number, callback: (err: any, res: any) => void) {
          const value = this.value;
          setTimeout(() => {
            callback(null, arg1 + arg2 + value);
          }, 0);
        }

         async methodAsync(_arg1: number, _arg2: number): Promise<any> {
            throw new Error("This should not be called directly");
         }
      }

      const instance = new TestClass(5);
      const methodAsync = promisify(instance.method, instance);

      const result = await methodAsync(1, 2);
      expect(result).toBe(8);

      // Testing dynamic context inheritance if not bound
      TestClass.prototype.methodAsync = promisify(TestClass.prototype.method);
      const result2 = await instance.methodAsync(2, 3);
      expect(result2).toBe(10);
    });
  });
});