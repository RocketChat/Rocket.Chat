import { sendStatistics } from '../../../../server/cron/statistics';
import telemetryEvent from '../lib/telemetryEvents';
import { Logger } from '../../../logger/server';

const logger = new Logger('SetupWizard');

type setupWizardDataType = { stepName: string; eventType: string };

export function setupWizardStats(data: setupWizardDataType): void {
	Promise.await(sendStatistics(logger, data));
}

telemetryEvent.register('setupWizardStats', setupWizardStats);
