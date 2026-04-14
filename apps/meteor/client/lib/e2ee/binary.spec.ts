import { Binary } from './binary';

describe('Binary', () => {
	describe('toString', () => {
		it('should convert ArrayBuffer to string', () => {
			const array = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
			const result = Binary.encode(array.buffer);
			expect(result).toBe('Hello');
		});

		it('should handle empty ArrayBuffer', () => {
			const buffer = new ArrayBuffer(0);
			const result = Binary.encode(buffer);
			expect(result).toBe('');
		});
	});

	describe('toArrayBuffer', () => {
		it('should convert string to ArrayBuffer', () => {
			const str = 'Hello';
			const buffer = Binary.decode(str);
			const uint8 = new Uint8Array(buffer);
			expect(Array.from(uint8)).toEqual([72, 101, 108, 108, 111]);
		});

		it('should handle empty string', () => {
			const str = '';
			const buffer = Binary.decode(str);
			expect(buffer.byteLength).toBe(0);
		});

		it('should throw RangeError for illegal char code', () => {
			const str = 'Hello\u0100'; // Character with char code 256
			expect(() => Binary.decode(str)).toThrowErrorMatchingInlineSnapshot(`"illegal char code: 256"`);
		});
	});
});
