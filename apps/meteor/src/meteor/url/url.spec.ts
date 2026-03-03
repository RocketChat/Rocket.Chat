import { describe, it, expect } from 'vitest';
import { URL, URLSearchParams, encodeParams, constructUrl } from './url.ts';

describe('URL Utilities', () => {
  describe('sanity checks', () => {
    it('should have native URL and URLSearchParams available', () => {
      expect(typeof URL).toBe('function');
      expect(typeof URLSearchParams).toBe('function');
    });
  });

  describe('encodeParams', () => {
    it('serializes nested parameters and arrays to query strings correctly', () => {
      const hash = {
        filter: {
          type: 'Foo',
          id_eq: 15,
        },
        array: ['1', 'a', 'dirty[]'],
        hasOwnProperty: 'horrible param name',
      };

      const expectedQuery =
        'filter[type]=Foo&filter[id_eq]=15&array[]=1&array[]=a' +
        '&array[]=dirty%5B%5D&hasOwnProperty=horrible+param+name';

      expect(encodeParams(hash)).toBe(expectedQuery);
    });
  });

  describe('constructUrl', () => {
    it('appends parameters cleanly to a URL without a query string', () => {
      const url = 'https://example.com/api';
      const params = { foo: 'bar', baz: 1 };
      
      expect(constructUrl(url, null, params)).toBe('https://example.com/api?foo=bar&baz=1');
    });

    it('replaces an existing query string if an override query string is provided', () => {
      const url = 'https://example.com/api?old=1';
      expect(constructUrl(url, 'new=2')).toBe('https://example.com/api?new=2');
    });

    it('merges parameters into the URL string', () => {
      const url = 'https://example.com/api?existing=1';
      const params = { newParam: 2 };
      
      expect(constructUrl(url, null, params)).toBe('https://example.com/api?existing=1&newParam=2');
    });
  });
});