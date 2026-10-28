import { api, credentials, request } from './api-data';

/**
 * Executes an app slash command via a POST request to commands.run.
 *
 * @param cmd - The slashcommand name to execute
 * @param rid - The room ID where the command will be executed
 * @param params - Optional parameters to pass to the command (default: '')
 * @param triggerId - Optional trigger ID for the command invocation (default: 'triggerId')
 *
 * @returns Promise resolving to the API response
 */
export const executeAppSlashCommand = (cmd: string, rid: string, params = '', triggerId = 'triggerId') =>
	request.post(api('commands.run')).set(credentials).send({
		command: cmd,
		params,
		roomId: rid,
		triggerId,
	});
