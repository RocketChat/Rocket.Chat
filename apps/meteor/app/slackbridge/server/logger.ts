import { Logger } from '../../logger/server';

const logger = new Logger('SlackBridge');

export const connLogger = logger.section('Connection');
export const classLogger = logger.section('Class');
export const slackLogger = logger.section('Slack');
export const rocketLogger = logger.section('Rocket');
