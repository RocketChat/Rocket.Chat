import { ServiceUnavailableException } from '@nestjs/common';
import { failClosedClient } from './fail-closed.js';

describe('failClosedClient', () => {
  const proxy = {
    canAccessRoom: async () => new Error('method-not-available'),
    hasPermission: async (uid: string) => uid === 'admin',
    getUsersFromPublicRoles: async () => [],
  };

  const client = failClosedClient(proxy, 'Authorization', [
    'canAccessRoom',
    'hasPermission',
  ]);

  it('rejects when the broker answers with an Error value', async () => {
    await expect(client.canAccessRoom()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('passes through the results of a reachable service', async () => {
    await expect(client.hasPermission('admin')).resolves.toBe(true);
    await expect(client.hasPermission('guest')).resolves.toBe(false);
  });

  it('exposes only the listed methods', () => {
    expect(Object.keys(client).sort()).toEqual([
      'canAccessRoom',
      'hasPermission',
    ]);
    expect('onApplicationShutdown' in client).toBe(false);
    expect('then' in client).toBe(false);
  });
});
