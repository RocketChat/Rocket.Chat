import { describe, it, expect } from 'vitest';
import { MongoID } from 'meteor/mongo-id';

describe('MongoID Modernization', () => {
  describe('ObjectID', () => {
    it('should generate a valid 24-character hex string', () => {
      const oid = new MongoID.ObjectID();
      expect(oid.valueOf()).toMatch(/^[0-9a-f]{24}$/);
    });

    it('should reconstruct from a hex string', () => {
      const hex = '507f1f77bcf86cd799439011';
      const oid = new MongoID.ObjectID(hex);
      expect(oid.valueOf()).toBe(hex);
    });

    it('should throw on invalid hex strings', () => {
      expect(() => new MongoID.ObjectID('not-hex')).toThrow();
    });
  });

  describe('idStringify / idParse Protocol', () => {
    it('should round-trip simple strings', () => {
      const input = 'normalString';
      const encoded = MongoID.idStringify(input);
      expect(encoded).toBe('normalString');
      expect(MongoID.idParse(encoded)).toBe(input);
    });

    it('should escape strings that look like ObjectIDs', () => {
      const fakeOid = 'afafafafafafafafafafafaf';
      const encoded = MongoID.idStringify(fakeOid);
      expect(encoded).toBe(`-${fakeOid}`);
      expect(MongoID.idParse(encoded)).toBe(fakeOid);
    });

    it('should handle undefined as "-"', () => {
      expect(MongoID.idStringify(undefined)).toBe('-');
      expect(MongoID.idParse('-')).toBeUndefined();
    });

    it('should handle primitives with "~" prefix', () => {
      expect(MongoID.idStringify(123)).toBe('~123');
      expect(MongoID.idStringify(true)).toBe('~true');
      expect(MongoID.idParse('~123')).toBe(123);
    });

    it('should handle ObjectIDs correctly', () => {
      const oid = new MongoID.ObjectID();
      const encoded = MongoID.idStringify(oid);
      expect(encoded).toBe(oid.valueOf());
      const parsed = MongoID.idParse(encoded);
      expect(parsed).toBeInstanceOf(MongoID.ObjectID);
      expect((parsed as MongoID.ObjectID).valueOf()).toBe(oid.valueOf());
    });
  });
});