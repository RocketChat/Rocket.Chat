/**
 * Secure Hash Algorithm (SHA256)
 * Original code by Angel Marin, Paul Johnston.
 * Refactored for modern TypeScript.
 */

const CHRSZ = 8;
const HEXCASE = 0; // 0 for lowercase, 1 for uppercase

const K = [
  0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
  0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
  0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
  0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
  0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2,
];

function safeAdd(x: number, y: number): number {
  const lsw = (x & 0xFFFF) + (y & 0xFFFF);
  const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

function S(X: number, n: number): number { return (X >>> n) | (X << (32 - n)); }
function R(X: number, n: number): number { return (X >>> n); }
function Ch(x: number, y: number, z: number): number { return ((x & y) ^ (~x & z)); }
function Maj(x: number, y: number, z: number): number { return ((x & y) ^ (x & z) ^ (y & z)); }
function Sigma0256(x: number): number { return (S(x, 2) ^ S(x, 13) ^ S(x, 22)); }
function Sigma1256(x: number): number { return (S(x, 6) ^ S(x, 11) ^ S(x, 25)); }
function Gamma0256(x: number): number { return (S(x, 7) ^ S(x, 18) ^ R(x, 3)); }
function Gamma1256(x: number): number { return (S(x, 17) ^ S(x, 19) ^ R(x, 10)); }

function coreSha256(m: number[], l: number): number[] {
  const HASH = [
    0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
    0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19,
  ];
  const W: number[] = new Array(64);
  
  let a: number, b: number, c: number, d: number;
  let e: number, f: number, g: number, h: number;
  let T1: number, T2: number;

  m[l >> 5] |= 0x80 << (24 - (l % 32));
  m[(((l + 64) >> 9) << 4) + 15] = l;

  for (let i = 0; i < m.length; i += 16) {
    a = HASH[0];
    b = HASH[1];
    c = HASH[2];
    d = HASH[3];
    e = HASH[4];
    f = HASH[5];
    g = HASH[6];
    h = HASH[7];

    for (let j = 0; j < 64; j++) {
      if (j < 16) {
        W[j] = m[j + i] || 0;
      } else {
        W[j] = safeAdd(
          safeAdd(safeAdd(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])),
          W[j - 16]
        );
      }

      T1 = safeAdd(safeAdd(safeAdd(safeAdd(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
      T2 = safeAdd(Sigma0256(a), Maj(a, b, c));

      h = g;
      g = f;
      f = e;
      e = safeAdd(d, T1);
      d = c;
      c = b;
      b = a;
      a = safeAdd(T1, T2);
    }

    HASH[0] = safeAdd(a, HASH[0]);
    HASH[1] = safeAdd(b, HASH[1]);
    HASH[2] = safeAdd(c, HASH[2]);
    HASH[3] = safeAdd(d, HASH[3]);
    HASH[4] = safeAdd(e, HASH[4]);
    HASH[5] = safeAdd(f, HASH[5]);
    HASH[6] = safeAdd(g, HASH[6]);
    HASH[7] = safeAdd(h, HASH[7]);
  }
  
  return HASH;
}

function str2binb(str: string): number[] {
  const bin: number[] = [];
  const mask = (1 << CHRSZ) - 1;
  for (let i = 0; i < str.length * CHRSZ; i += CHRSZ) {
    bin[i >> 5] = (bin[i >> 5] || 0) | ((str.charCodeAt(i / CHRSZ) & mask) << (24 - (i % 32)));
  }
  return bin;
}

function utf8Encode(string: string): string {
  let utftext = "";

  for (let n = 0; n < string.length; n++) {
    const c = string.charCodeAt(n);

    if (c < 128) {
      utftext += String.fromCharCode(c);
    } else if (c > 127 && c < 2048) {
      utftext += String.fromCharCode((c >> 6) | 192);
      utftext += String.fromCharCode((c & 63) | 128);
    } else {
      utftext += String.fromCharCode((c >> 12) | 224);
      utftext += String.fromCharCode(((c >> 6) & 63) | 128);
      utftext += String.fromCharCode((c & 63) | 128);
    }
  }

  return utftext;
}

function binb2hex(binarray: number[]): string {
  const hexTab = HEXCASE ? "0123456789ABCDEF" : "0123456789abcdef";
  let str = "";
  
  for (let i = 0; i < binarray.length * 4; i++) {
    str +=
      hexTab.charAt((binarray[i >> 2] >> ((3 - (i % 4)) * 8 + 4)) & 0xF) +
      hexTab.charAt((binarray[i >> 2] >> ((3 - (i % 4)) * 8)) & 0xF);
  }
  
  return str;
}

/**
 * Computes the SHA256 hash of a given string.
 *
 * @param s - The input string to hash.
 * @returns The SHA256 hash as a hex string.
 */
export function SHA256(s: string): string {
  const utf8Str = utf8Encode(s);
  return binb2hex(coreSha256(str2binb(utf8Str), utf8Str.length * CHRSZ));
}