import { credentials, methodCall, request } from './api-data';

/**
 * Executes an app slash command via a POST request to the slashCommand method.
 *
 * @param cmd - The slashcommand name to execute
 * @param rid - The room ID where the command will be executed
 * @param params - Optional parameters to pass to the command (default: '')
 * @param triggerId - Optional trigger ID for the command invocation (default: 'triggerId')
 *
 * @returns Promise resolving to the API response
 */
export const executeAppSlashCommand = (cmd: string, rid: string, params = '', triggerId = 'triggerId') =>
	request
		.post(methodCall('slashCommand'))
		.set(credentials)
		.send({
			message: JSON.stringify({
				id: 'id',
				msg: 'method',
				method: 'slashCommand',
				params: [
					{
						cmd,
						params,
						triggerId,
						msg: {
							rid,
							_id: 'message_id',
							msg: `/${cmd} ${params}`.trim(),
						},
					},
				],
			}),
		});
