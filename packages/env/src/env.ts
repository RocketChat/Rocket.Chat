import { parseEnv } from './parse';
import type { RocketChatEnv } from './types';

export const env: Readonly<RocketChatEnv> = parseEnv();
