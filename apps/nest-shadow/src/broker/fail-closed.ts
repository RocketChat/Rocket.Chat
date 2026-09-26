import { ServiceUnavailableException } from '@nestjs/common';

type AsyncMethod = (...args: any[]) => Promise<unknown>;

// Binds the listed methods of a broker proxy into a plain client. The network
// broker resolves a call to an unreachable service with an Error value instead
// of a rejection, and a truthy Error must never pass as a permission grant, so
// every call through the client rejects instead.
export function failClosedClient<T extends object, K extends keyof T & string>(
  service: T,
  name: string,
  methods: readonly K[],
): Pick<T, K> {
  return Object.fromEntries(
    methods.map((method) => [
      method,
      async (...args: unknown[]) => {
        const result = await (service[method] as AsyncMethod)(...args);

        if (result instanceof Error) {
          throw new ServiceUnavailableException(
            `${name}.${method} is not available: ${result.message}`,
          );
        }

        return result;
      },
    ]),
  ) as Pick<T, K>;
}
