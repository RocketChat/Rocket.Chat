import { TextEncoder } from 'node:util';

import { toHaveNoViolations } from 'jest-axe';

Object.assign(globalThis, { TextEncoder });

expect.extend(toHaveNoViolations);
