import { describe, it, expect } from 'vitest';
import { EJSON } from 'meteor/ejson';

// --- Custom Models For Tests ---

class Address {
    city: string;
    state: string;

    constructor(city: string, state: string) {
        this.city = city;
        this.state = state;
    }

    typeName() {
        return 'Address';
    }

    toJSONValue() {
        return {
            city: this.city,
            state: this.state,
        };
    }
}

EJSON.addType('Address', value => new Address(value.city, value.state));

class Person {
    name: string;
    dob: Date;
    address: Address;

    constructor(name: string, dob: Date, address: Address) {
        this.name = name;
        this.dob = dob;
        this.address = address;
    }

    typeName() {
        return 'Person';
    }

    toJSONValue() {
        return {
            name: this.name,
            dob: EJSON.toJSONValue(this.dob),
            address: EJSON.toJSONValue(this.address),
        };
    }
}

EJSON.addType(
    'Person',
    value => new Person(
        value.name,
        EJSON.fromJSONValue(value.dob),
        EJSON.fromJSONValue(value.address)
    )
);

class Holder {
    content: any;

    constructor(content: any) {
        this.content = content;
    }

    typeName() {
        return 'Holder';
    }

    toJSONValue() {
        return this.content;
    }
}

EJSON.addType('Holder', value => new Holder(value));

// --- Tests ---

describe('EJSON', () => {
    it('keyOrderSensitive', () => {
        expect(EJSON.equals({
            a: { b: 1, c: 2 },
            d: { e: 3, f: 4 },
        }, {
            d: { f: 4, e: 3 },
            a: { c: 2, b: 1 },
        })).toBe(true);

        expect(EJSON.equals({
            a: { b: 1, c: 2 },
            d: { e: 3, f: 4 },
        }, {
            d: { f: 4, e: 3 },
            a: { c: 2, b: 1 },
        }, { keyOrderSensitive: true })).toBe(false);

        expect(EJSON.equals({
            a: { b: 1, c: 2 },
            d: { e: 3, f: 4 },
        }, {
            a: { c: 2, b: 1 },
            d: { f: 4, e: 3 },
        }, { keyOrderSensitive: true })).toBe(false);

        expect(EJSON.equals({ a: {} }, { a: { b: 2 } }, { keyOrderSensitive: true })).toBe(false);
        expect(EJSON.equals({ a: { b: 2 } }, { a: {} }, { keyOrderSensitive: true })).toBe(false);
    });

    it('nesting and literal', () => {
        const d = new Date();
        const obj = { $date: d };
        const eObj = EJSON.toJSONValue(obj);
        const roundTrip = EJSON.fromJSONValue(eObj);
        expect(obj).toEqual(roundTrip);
    });

    it('some equality tests', () => {
        expect(EJSON.equals({ a: 1, b: 2, c: 3 }, { a: 1, c: 3, b: 2 })).toBe(true);
        expect(EJSON.equals({ a: 1, b: 2 }, { a: 1, c: 3, b: 2 })).toBe(false);
        expect(EJSON.equals({ a: 1, b: 2, c: 3 }, { a: 1, b: 2 })).toBe(false);
        expect(EJSON.equals({ a: 1, b: 2, c: 3 }, { a: 1, c: 3, b: 4 })).toBe(false);
        expect(EJSON.equals({ a: {} }, { a: { b: 2 } })).toBe(false);
        expect(EJSON.equals({ a: { b: 2 } }, { a: {} })).toBe(false);

        expect(EJSON.equals([1, 2, 3, 4, 5], [1, 2, 3, 4, 5])).toBe(true);
        expect(EJSON.equals([1, 2, 3, 4, 5], [1, 2, 3, 4])).toBe(false);
        expect(EJSON.equals([1, 2, 3, 4], { 0: 1, 1: 2, 2: 3, 3: 4 })).toBe(false);
        expect(EJSON.equals({ 0: 1, 1: 2, 2: 3, 3: 4 }, [1, 2, 3, 4])).toBe(false);
        expect(EJSON.equals({}, [])).toBe(false);
        expect(EJSON.equals([], {})).toBe(false);
    });

    it('equality and falsiness', () => {
        expect(EJSON.equals(null, null)).toBe(true);
        expect(EJSON.equals(undefined, undefined)).toBe(true);
        expect(EJSON.equals({ foo: 'foo' }, null)).toBe(false);
        expect(EJSON.equals(null, { foo: 'foo' })).toBe(false);
        expect(EJSON.equals(undefined, { foo: 'foo' })).toBe(false);
        expect(EJSON.equals({ foo: 'foo' }, undefined)).toBe(false);
    });

    it('NaN and Inf', () => {
        expect(EJSON.parse('{"$InfNaN": 1}')).toEqual(Infinity);
        expect(EJSON.parse('{"$InfNaN": -1}')).toEqual(-Infinity);
        expect(Number.isNaN(EJSON.parse('{"$InfNaN": 0}'))).toBe(true);
        expect(EJSON.parse(EJSON.stringify(Infinity))).toEqual(Infinity);
        expect(EJSON.parse(EJSON.stringify(-Infinity))).toEqual(-Infinity);
        expect(Number.isNaN(EJSON.parse(EJSON.stringify(NaN)))).toBe(true);

        expect(EJSON.equals(NaN, NaN)).toBe(true);
        expect(EJSON.equals(Infinity, Infinity)).toBe(true);
        expect(EJSON.equals(-Infinity, -Infinity)).toBe(true);
        expect(EJSON.equals(Infinity, -Infinity)).toBe(false);
        expect(EJSON.equals(Infinity, NaN)).toBe(false);
        expect(EJSON.equals(Infinity, 0)).toBe(false);
        expect(EJSON.equals(NaN, 0)).toBe(false);

        expect(EJSON.equals(
            EJSON.parse('{"a": {"$InfNaN": 1}}'),
            { a: Infinity }
        )).toBe(true);

        expect(EJSON.equals(
            EJSON.parse('{"a": {"$InfNaN": 0}}'),
            { a: NaN }
        )).toBe(true);
    });

    it('clone', () => {
        const cloneTest = (x: any, identical?: boolean) => {
            const y = EJSON.clone(x);
            expect(EJSON.equals(x, y)).toBe(true);
            if (identical) {
                expect(x === y).toBe(true);
            } else {
                expect(x === y).toBe(false);
            }
        };

        cloneTest(null, true);
        cloneTest(undefined, true);
        cloneTest(42, true);
        cloneTest('asdf', true);
        cloneTest([1, 2, 3]);
        cloneTest([1, 'fasdf', { foo: 42 }]);
        cloneTest({ x: 42, y: 'asdf' });

        function testCloneArgs(..._args: any[]) {
            const clonedArgs = EJSON.clone(arguments);
            expect(clonedArgs).toEqual([1, 2, 'foo', [4]]);
        }
        testCloneArgs(1, 2, 'foo', [4]);
    });

    it('stringify', () => {
        expect(EJSON.stringify(null)).toBe('null');
        expect(EJSON.stringify(true)).toBe('true');
        expect(EJSON.stringify(false)).toBe('false');
        expect(EJSON.stringify(123)).toBe('123');
        expect(EJSON.stringify('abc')).toBe('"abc"');

        expect(EJSON.stringify([1, 2, 3])).toBe('[1,2,3]');
        expect(EJSON.stringify([1, 2, 3], { indent: true })).toBe('[\n  1,\n  2,\n  3\n]');
        expect(EJSON.stringify([1, 2, 3], { canonical: false })).toBe('[1,2,3]');
        expect(EJSON.stringify([1, 2, 3], { indent: true, canonical: false })).toBe('[\n  1,\n  2,\n  3\n]');

        expect(EJSON.stringify([1, 2, 3], { indent: 4 })).toBe('[\n    1,\n    2,\n    3\n]');
        expect(EJSON.stringify([1, 2, 3], { indent: '--' })).toBe('[\n--1,\n--2,\n--3\n]');

        expect(
            EJSON.stringify({ b: [2, { d: 4, c: 3 }], a: 1 }, { canonical: true })
        ).toBe('{"a":1,"b":[2,{"c":3,"d":4}]}');

        expect(
            EJSON.stringify(
                { b: [2, { d: 4, c: 3 }], a: 1 },
                { indent: true, canonical: true }
            )
        ).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    {\n      "c": 3,\n      "d": 4\n    }\n  ]\n}');

        expect(
            EJSON.stringify({ b: [2, { d: 4, c: 3 }], a: 1 }, { canonical: false })
        ).toBe('{"b":[2,{"d":4,"c":3}],"a":1}');

        // Test Circular reference handling
        const circularObj: any = {};
        circularObj.a = circularObj;
        expect(() => EJSON.stringify(circularObj)).toThrowError(/Converting circular structure to JSON/);
    });

    it('parse', () => {
        expect(EJSON.parse('[1,2,3]')).toEqual([1, 2, 3]);
        expect(() => EJSON.parse(null as any)).toThrowError(/argument should be a string/);
    });

    it('regexp', () => {
        expect(EJSON.stringify(/foo/gi)).toBe('{"$regexp":"foo","$flags":"gi"}');
        const obj = { $regexp: "foo", $flags: "gi" };

        const eObj = EJSON.toJSONValue(obj);
        const roundTrip = EJSON.fromJSONValue(eObj);
        expect(obj).toEqual(roundTrip);
    });

    it('custom types', () => {
        const testSameConstructors = (someObj: any, compareWith: any) => {
            expect(someObj.constructor).toBe(compareWith.constructor);
            if (typeof someObj === 'object') {
                Object.keys(someObj).forEach(key => {
                    testSameConstructors(someObj[key], compareWith[key]);
                });
            }
        };

        const testReallyEqual = (someObj: any, compareWith: any) => {
            expect(someObj).toEqual(compareWith);
            testSameConstructors(someObj, compareWith);
        };

        const testRoundTrip = (someObj: any) => {
            const str = EJSON.stringify(someObj);
            const roundTrip = EJSON.parse(str);
            testReallyEqual(someObj, roundTrip);
        };

        const testCustomObject = (someObj: any) => {
            testRoundTrip(someObj);
            testReallyEqual(someObj, EJSON.clone(someObj));
        };

        const a = new Address('Montreal', 'Quebec');
        testCustomObject({ address: a });

        const nakedA = { city: 'Montreal', state: 'Quebec' };

        // Change .toEqual to .toStrictEqual so Vitest accounts for the Address prototype
        expect(nakedA).not.toStrictEqual(a);
        expect(a).not.toStrictEqual(nakedA);

        const holder = new Holder(nakedA);
        expect(holder.toJSONValue()).toEqual(a.toJSONValue()); // sanity check

        // These can optionally be changed to .toStrictEqual as well for consistency
        expect(holder).not.toStrictEqual(a);
        expect(a).not.toStrictEqual(holder);

        const d = new Date();
        const obj = new Person('John Doe', d, a);
        testCustomObject(obj);

        const clone = EJSON.clone(obj);
        clone.address.city = 'Sherbrooke';
        expect(obj).not.toStrictEqual(clone);
    });

    it('handle objects with properties named "length"', () => {
        class Widget {
            length: number;
            constructor() {
                this.length = 10;
            }
        }
        const widget = new Widget();

        const toJsonWidget = EJSON.toJSONValue(widget);
        expect(widget).toEqual(toJsonWidget);

        const fromJsonWidget = EJSON.fromJSONValue(widget);
        expect(widget).toEqual(fromJsonWidget);

        const stringifiedWidget = EJSON.stringify(widget);
        expect(stringifiedWidget).toBe('{"length":10}');

        const parsedWidget = EJSON.parse('{"length":10}');
        expect({ length: 10 }).toEqual(parsedWidget);

        expect(EJSON.isBinary(widget)).toBe(false);

        const widget2 = new Widget();
        expect(widget).toEqual(widget2);

        const clonedWidget = EJSON.clone(widget);
        expect(widget).toEqual(clonedWidget);
    });
});