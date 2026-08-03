/**
 * Request and response examples for the commands endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
/**
 * Local on purpose: importing the framework type here would put the examples in the type graph of
 * every endpoint that uses them, and this module only needs to describe their shape.
 */
type PayloadExamples = {
	query?: Record<string, unknown>;
	params?: Record<string, unknown>;
	body?: unknown;
	response?: Record<number, unknown>;
};

export const commandsExamples: Record<string, PayloadExamples> = {
	'commands.get': {
		response: {
			'200': {
				Success: {
					value: {
						command: {
							command: 'me',
							params: 'your_message',
							description: 'Displays_action_text',
							clientOnly: false,
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The query param "command" must be provided.',
					},
				},
			},
		},
	},
	'commands.list': {
		response: {
			'200': {
				Success: {
					value: {
						commands: [
							{
								command: 'invite-all-from',
								clientOnly: false,
							},
							{
								command: 'slackbridge-import',
								clientOnly: false,
							},
							{
								command: 'gimme',
								params: 'your_message_optional',
								description: 'Slash_Gimme_Description',
								clientOnly: false,
							},
							{
								command: 'lennyface',
								params: 'your_message_optional',
								description: 'Slash_LennyFace_Description',
								clientOnly: false,
							},
							{
								command: 'shrug',
								params: 'your_message_optional',
								description: 'Slash_Shrug_Description',
								clientOnly: false,
							},
							{
								command: 'tableflip',
								params: 'your_message_optional',
								description: 'Slash_Tableflip_Description',
								clientOnly: false,
							},
							{
								command: 'unflip',
								params: 'your_message_optional',
								description: 'Slash_TableUnflip_Description',
								clientOnly: false,
							},
							{
								command: 'create',
								clientOnly: false,
							},
							{
								command: 'help',
								clientOnly: false,
							},
							{
								command: 'invite',
								clientOnly: false,
							},
							{
								command: 'invite-all-to',
								clientOnly: false,
							},
							{
								command: 'archive',
								clientOnly: false,
							},
							{
								command: 'join',
								clientOnly: false,
							},
							{
								command: 'kick',
								clientOnly: false,
							},
							{
								command: 'leave',
								clientOnly: false,
							},
							{
								command: 'part',
								clientOnly: false,
							},
							{
								command: 'me',
								params: 'your_message',
								description: 'Displays_action_text',
								clientOnly: false,
							},
							{
								command: 'msg',
								clientOnly: false,
							},
							{
								command: 'mute',
								clientOnly: false,
							},
							{
								command: 'unmute',
								clientOnly: false,
							},
							{
								command: 'topic',
								params: 'Slash_Topic_Params',
								description: 'Slash_Topic_Description',
								clientOnly: false,
							},
							{
								command: 'unarchive',
								clientOnly: false,
							},
						],
						offset: 0,
						count: 22,
						total: 22,
						success: true,
					},
				},
			},
		},
	},
	'commands.run': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'You must provide a command to run.',
					},
				},
			},
		},
		body: {
			Success: {
				value: {
					command: 'unmute',
					roomId: 'ByehQjC44FwMeiLbX',
					params: '@user123',
					tmid: 'Hsj2435g4bvrj4bjh',
					triggerId: 'awovufbukuefzuper',
				},
			},
		},
	},
	'commands.preview': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'You must provide a command to run the preview item on.',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					command: 'unmute',
					roomId: 'ByehQjC44FwMeiLbX',
					tmid: 'Hsj2435g4bvrj4bjh',
					params: '@user123',
					triggerId: 'awovufbukuefzuper',
					previewItem: {
						id: 'nucobdipokaikazia',
						type: 'image',
						value: 'https://dev.null/gif',
					},
				},
			},
		},
	},
};
