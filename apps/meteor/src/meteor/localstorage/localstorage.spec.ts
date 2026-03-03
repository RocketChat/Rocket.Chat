import { describe, it, expect, beforeEach } from 'vitest';
import { localStorage } from './localstorage.ts';

describe('LocalStorage Utility', () => {
  beforeEach(() => {
    localStorage.removeItem('test-key');
  });

  it('should set and get items correctly', () => {
    localStorage.setItem('test-key', 'test-value');
    expect(localStorage.getItem('test-key')).toBe('test-value');
  });

  it('should return null for non-existent items', () => {
    expect(localStorage.getItem('non-existent')).toBe(null);
  });

  it('should remove items correctly', () => {
    localStorage.setItem('test-key', 'test-value');
    localStorage.removeItem('test-key');
    expect(localStorage.getItem('test-key')).toBe(null);
  });
});