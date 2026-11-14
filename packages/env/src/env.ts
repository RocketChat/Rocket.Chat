import { parseEnv } from './parse';
import type { IRocketChatEnv } from './types';

export const env: Readonly<IRocketChatEnv> = parseEnv();
