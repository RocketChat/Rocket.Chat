import { updateCounter } from './updateStatsCounter';
import telemetryEvent from '../lib/telemetryEvents';

type slashCommandsDataType = { command: string };

export function slashCommandsStats(data: slashCommandsDataType): void {
	if (data.command === 'jitsi') {
		updateCounter({ settingsId: 'Jitsi_Start_SlashCommands_Count' });
	}
}

telemetryEvent.register('slashCommandsStats', slashCommandsStats);
