import { Logger } from '../../../logger/server';

const logger = new Logger('Federation');

export const clientLogger = logger.section('client');
export const cryptLogger = logger.section('crypt');
export const dnsLogger = logger.section('dns');
export const httpLogger = logger.section('http');
export const serverLogger = logger.section('server');
export const setupLogger = logger.section('Setup');
