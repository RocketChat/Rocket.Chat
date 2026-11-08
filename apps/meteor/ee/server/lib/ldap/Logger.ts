import { Logger } from '@rocket.chat/logger';

export const logger = new Logger('LDAP');
export const connLogger = logger.section('Connection');
export const bindLogger = logger.section('Bind');
export const searchLogger = logger.section('Search');
export const authLogger = logger.section('Auth');
export const mapLogger = logger.section('Mapping');
