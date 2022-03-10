import { updateCounter } from './updateStatsCounter';

export function slashCommandsStats(command: string): void {
	if (command === 'jitsi') {
		updateCounter('Jitsi_Start_SlashCommands_Count');
	}
}
