import { Buffer } from 'buffer';

const base64Image =
	'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';

export const bigConversationData = {
	visitor: {
		_id: '66184feb05f0f4f279b3f662',
		username: 'guest-2',
		name: 'Someone',
		visitorEmails: [
			{
				address: 'g5iUv@example.com',
			},
		],
	},
	agent: {
		_id: '2Eojr2CmXGRmN8DJo',
		username: 'admin1',
		name: 'admin1',
		utcOffset: -6,
	},
	closedAt: '2024-04-23T20:14:29.318Z',
	siteName: 'Another test',
	messages: [
		{
			_id: 'wamid.Hfasdfafaefafsvj;lk34dsflkasafs5RjI2AA==',
			msg: 'Está\n\n(Respondendo http://localhost:3000/live/HE52FvKLMNgHcxMZ6?msg=eoh4jM9icAoD9REzr )',
			u: {
				_id: '66184feb05f0f4f279b3f662',
				username: 'guest-2',

				name: 'Someone',
			},
			files: [],
			quotes: [
				{
					name: 'Botsito',
					md: [
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: 'Bom dia , REDACTEDNAME',
								},
								{
									type: 'EMOJI',
									unicode: '😊',
								},

								{
									type: 'EMOJI',
									unicode: '❤',
								},
							],
						},
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'EMOJI',
									unicode: '📆',
								},
								{
									type: 'PLAIN_TEXT',
									value: ' DIA:*19/02',
								},
								{
									type: 'BOLD',

									value: [
										{
											type: 'PLAIN_TEXT',
											value: '  (Testeria )  ',
										},
									],
								},
								{
									type: 'PLAIN_TEXT',
									value: 'Morelia*  *ONLINE* ',
								},
							],
						},
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: ' ',
								},
								{
									type: 'EMOJI',
									unicode: '⏰',
								},
								{
									type: 'BOLD',
									value: [
										{
											type: 'PLAIN_TEXT',
											value: '20:40',
										},
									],
								},
								{
									type: 'PLAIN_TEXT',
									value: ' Some nice text',
								},
								{
									type: 'BOLD',
									value: [
										{
											type: 'PLAIN_TEXT',
											value: ', because writing text for testing is the best thing to do. ',
										},
									],
								},
								{
									type: 'PLAIN_TEXT',

									value: 'And why not, we write some words in spanish as well.*',
								},
							],
						},
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: 'Estas son algunas palabras en spanish so RC has spanish too!, ',
								},
								{
									type: 'BOLD',
									value: [
										{
											type: 'PLAIN_TEXT',
											value: 'no spanish',
										},
									],
								},
								{
									type: 'PLAIN_TEXT',
									value: ' This text should be a really bit longer, so pls help copilot i dont want to write more text pls why.',
								},
							],
						},
						{
							type: 'UNORDERED_LIST',
							value: [
								{
									type: 'LIST_ITEM',
									value: [
										{
											type: 'BOLD',
											value: [
												{
													type: 'PLAIN_TEXT',
													value: 'Because writing text for testing is the best thing to do. ',
												},
											],
										},
										{
											type: 'PLAIN_TEXT',
											value:
												' Can you just write a really long line of text? And why not, we write some words in spanish as well. Oh god just repeating myself',
										},
										{
											type: 'EMOJI',
											value: {
												type: 'PLAIN_TEXT',
												value: ';)',
											},

											shortCode: 'wink',
										},
										{
											type: 'PLAIN_TEXT',
											value: ' )',
										},
									],
								},
							],
						},

						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: 'And all because we wanted to test that a really long PDF can be rendered by the lib. ',
								},
							],
						},
						{
							type: 'UNORDERED_LIST',

							value: [
								{
									type: 'LIST_ITEM',
									value: [
										{
											type: 'PLAIN_TEXT',

											value:
												'Cmon just write something im tired and out of imagination, and that should be enough, arg, copilot was better.',
										},
									],
								},
							],
						},
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'EMOJI',
									unicode: '⚠',
								},
								{
									type: 'PLAIN_TEXT',
									value: ' You dont know what you have until you lose it. ',
								},
							],
						},
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value:
										'↪ I am intentionally leaving some unicode symbols in here so we can also test the logic for generating and the PDF transcript would not be affected. Sadly I cannot test that the PDF generated has the proper style from here cause that would be nice. ',
								},
								{
									type: 'EMOJI',
									unicode: '⚠',
								},
							],
						},

						{
							type: 'UNORDERED_LIST',

							value: [
								{
									type: 'LIST_ITEM',
									value: [
										{
											type: 'PLAIN_TEXT',

											value:
												'NVIM is fast for deleting text but sometimes feel slow when youre writing it, maybe some completion tool is just messing around. ',
										},
										{
											type: 'EMOJI',
											unicode: '📑',
										},
									],
								},
							],
						},
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'EMOJI',
									unicode: '⚠',
								},
								{
									type: 'PLAIN_TEXT',
									value: ' Atenção: Some portuguese words around because we also can. ',
								},
								{
									type: 'BOLD',
									value: [
										{
											type: 'PLAIN_TEXT',
											value: 'And i wanted to write an script to do this, actually, this is not that bad, kinda fun',
										},
									],
								},
								{
									type: 'PLAIN_TEXT',
									value: '!! ',
								},
								{
									type: 'EMOJI',
									unicode: '⚠',
								},
							],
						},
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value:
										'Have you ever heard of faker.js? Nice tool for writing such long texts, but it lacks the human part of it and so the texts tend to feel boring, these ones have some love on them <3 ',
								},
							],
						},
						{
							type: 'LINE_BREAK',
						},
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'BOLD',
									value: [
										{
											type: 'PLAIN_TEXT',
											value: 'Asegurese que el test esta funcionando correctamente',
										},
									],
								},
							],
						},
					],

					ts: '2024-02-15T12:59:39.140Z',
				},
			],
			ts: '2024-02-15T13:34:27.133Z',
			md: [
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: 'Esta',
						},
					],
				},
				{
					type: 'LINE_BREAK',
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '(Respondendo ',
						},
						{
							type: 'LINK',
							value: {
								src: {
									type: 'PLAIN_TEXT',
									value: 'http://localhost:3000/live/HE52FvKLMNgHcxMZ6?msg=eoh4jM9icAoD9REzr',
								},
								label: [
									{
										type: 'PLAIN_TEXT',

										value: 'http://localhost:3000/live/HE52FvKLMNgHcxMZ6?msg=eoh4jM9icAoD9REzr',
									},
								],
							},
						},

						{
							type: 'PLAIN_TEXT',

							value: ' )',
						},
					],
				},
			],
		},
		{
			_id: 'vW7MG6de3uNffmo2Q',
			files: [],
			quotes: [],
			ts: '2024-04-11T21:02:35.773Z',
			u: {
				_id: '66184feb0f4f279b3f662',
				username: 'guest-2',
				name: 'Someone',
			},
			msg: 'this_a_test_message_from_user',
			md: [
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: 'this_a_test_message_from_user',
						},
					],
				},
			],
		},
		{
			_id: 'eoh4jM9icAoD9REzr',
			files: [],
			quotes: [],
			ts: '2024-04-23T20:12:13.564Z',
			u: {
				_id: '2Eojr2CmXGRmN8DJo',
				username: 'admin1',
				name: 'admin1',
			},

			msg: 'fadsfads',
			md: [
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: 'fadsfads',
						},
					],
				},
			],
		},
		{
			_id: 'LAcKGwyq2nSnXXuxR',
			msg: 'PDF Transcript successfully generated',
			u: {
				_id: 'rocket.cat',
				username: 'rocket.cat',

				name: 'Rocket.Cat',
			},
			files: [
				{
					name: 'Transcript_Another test_4-24-2024_Alayna.pdf',
					buffer: null,
				},
			],
			quotes: [],
			ts: '2024-04-24T13:50:04.592Z',

			md: [
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: 'PDF Transcript successfully generated',
						},
					],
				},
			],
		},
		{
			_id: 'QQFeBWBmvwdaHNKCq',
			msg: 'PDF Transcript successfully generated, this is a very long message that should be just fine. no all caps just wowow im drowning i vindicated im selfish im raw im right i swear im rigth when i look into your eyes and i am fly when im treating out so well, im sitting in the life for things that we could to urself oversized and overwhelmend and rendered me so isolatred and so motivated i am certain now that i am vidicated i am selfish i am wrong i am right i swear im right swear i knew it al allong',
			u: {
				_id: 'rocket.cat',

				username: 'rocket.cat',
				name: 'Rocket.Cat',
			},
			files: [
				{
					name: 'Transcript_Another test_4-24-2024_Alayna.pdf',
					buffer: null,
				},
			],
			quotes: [],
			ts: '2024-04-24T14:01:43.987Z',
		},
	],
	dateFormat: 'LL',
	timeAndDateFormat: 'LLL',
	timezone: 'America/Guatemala',

	translations: [
		{
			key: 'Agent',
			value: 'Agent',
		},
		{
			key: 'Date',
			value: 'Date',
		},
		{
			key: 'Customer',
			value: 'Customer',
		},
		{
			key: 'Not_assigned',
			value: 'Not assigned',
		},
		{
			key: 'Time',
			value: 'Time',
		},
		{
			key: 'Chat_transcript',
			value: 'Chat transcript',
		},
		{
			key: 'This_attachment_is_not_supported',

			value: 'Attachment format not supported',
		},
	],
};

export const dataWithASingleMessageButAReallyLongMessage = {
	agent: {
		name: 'Juanito De Ponce',
		username: 'juanito.ponce',
	},
	visitor: {
		name: 'Christian Castro',
		username: 'christian.castro',
	},
	siteName: 'Rocket.Chat',
	closedAt: '2022-11-21T00:00:00.000Z',
	dateFormat: 'MMM D, YYYY',
	timeAndDateFormat: 'MMM D, YYYY H:mm:ss',
	timezone: 'Etc/GMT+1',
	translations: [
		{
			key: 'Agent',
			value: 'Agent',
		},
		{
			key: 'Date',
			value: 'Date',
		},
		{
			key: 'Customer',
			value: 'Customer',
		},
		{
			key: 'Chat_transcript',
			value: 'Chat transcript',
		},
		{
			key: 'Time',
			value: 'Time',
		},
		{
			key: 'This_attachment_is_not_supported',
			value: 'Attachment format not supported',
		},
	],
	messages: [
		{
			ts: '2022-11-21T16:00:00.000Z',
			u: {
				_id: '123',
				name: 'Juanito De Ponce',
				username: 'juanito.ponce',
			},
			msg: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in massa ullamcorper diam semper lobortis vitae non ex. Donec vitae nunc neque. Suspendisse aliquet luctus mauris ut scelerisque. Cras quis consectetur ex. Praesent sodales id augue in venenatis. Duis nisl magna, pharetra eu odio sit amet, venenatis accumsan erat. Donec euismod feugiat diam ac congue. Proin aliquet porta consectetur. Etiam hendrerit arcu urna.

Maecenas pretium, sem non eleifend sodales, sapien ligula sollicitudin mauris, vel imperdiet risus mi id neque. Duis tincidunt volutpat odio sit amet sodales. Sed in risus elementum, posuere nibh ut, lobortis lacus. Nulla blandit mi eget libero blandit ultricies. Etiam ut velit dui. Nunc sit amet finibus turpis, in mollis tellus. Sed commodo augue non ligula pulvinar semper. Cras a sollicitudin turpis. Duis faucibus mattis facilisis. Proin sit amet dui et velit cursus tincidunt et eget elit.

Cras sollicitudin elit nec dui accumsan pellentesque. Aenean semper tortor nisl, non tempor risus ornare sed. Duis fringilla tincidunt nulla, vitae pellentesque eros consectetur ac. Nunc neque velit, feugiat vitae mi nec, finibus imperdiet dolor. Morbi aliquet sit amet purus rutrum accumsan. Nunc ultrices odio non purus lobortis consectetur. Vivamus blandit convallis nisl, id viverra ligula congue a. Vivamus auctor nulla vitae turpis porttitor, at viverra dolor convallis. Vestibulum vel vestibulum nibh. Donec dignissim tortor blandit, porta metus sit amet, condimentum dui.

Cras id lectus nunc. Praesent in luctus lacus. Duis venenatis tempor tincidunt. Proin rhoncus malesuada nulla imperdiet varius. Etiam scelerisque euismod ex id porta. Integer finibus sit amet ex non pellentesque. Integer posuere semper massa. Morbi vel quam vitae lectus scelerisque semper. Interdum et malesuada fames ac ante ipsum primis in faucibus.

Donec lorem lacus, consequat et aliquam id, vestibulum id ipsum. Phasellus mi erat, cursus a leo a, commodo dapibus sapien. Morbi volutpat erat quam, quis lobortis mauris gravida ut. Nullam vitae enim sit amet turpis luctus ultrices. Nulla ac ante tristique, suscipit purus id, finibus nisi. Aliquam posuere nibh nisl, et ullamcorper lorem malesuada nec. Sed volutpat molestie lacus ornare maximus. Mauris porttitor pharetra mauris quis aliquet. Nullam malesuada purus sem, vitae bibendum leo posuere eu. Donec urna nibh, ultrices tempor gravida sed, condimentum a sapien.

Duis efficitur sit amet elit a maximus. Nunc vel lacus justo. In accumsan, nisl vel sollicitudin convallis, purus libero iaculis nulla, vitae egestas urna lorem sed ante. Etiam quis luctus lacus. Donec velit dui, feugiat a lacinia a, mattis sed felis. Curabitur nisl leo, hendrerit eget accumsan id, lacinia nec velit. Suspendisse sagittis augue a justo pellentesque, non dictum purus pulvinar. Morbi eleifend sit amet nunc sit amet aliquet. Proin posuere dapibus blandit. Suspendisse vel sapien id nisi tempus ornare placerat lobortis mauris. Ut lacinia egestas sem, at lobortis nisl elementum id. Vestibulum mattis metus mi, ut pellentesque metus ultricies eu. Phasellus sed nisi sit amet mauris semper fermentum. Suspendisse ut placerat risus.


Nullam mattis sit amet magna ut condimentum. Morbi posuere in lectus vitae tincidunt. Aliquam accumsan fermentum lorem, eget iaculis magna iaculis et. Nulla dignissim vitae enim id viverra. Phasellus sapien ante, egestas et elit id, facilisis hendrerit ligula. Phasellus eleifend diam nisi, sit amet pretium ex interdum tempor. Fusce vitae lobortis ligula. Sed aliquam nisl at tellus varius, eu mollis ante ultricies. Sed et ligula elementum, euismod erat viverra, pellentesque turpis. Maecenas sagittis vestibulum justo, ac convallis ex tincidunt imperdiet. Donec vehicula lacinia lacus, vitae luctus nisi faucibus et. Quisque sollicitudin imperdiet maximus. Suspendisse dignissim orci vel placerat tristique. Morbi viverra ullamcorper neque, ut varius nisl congue sit amet. Mauris sed mauris vel nibh iaculis pulvinar eget vel dui. Maecenas ac enim velit.

Cras et luctus ante. Sed gravida ipsum sit amet odio blandit aliquet. Vivamus ac sagittis ipsum, quis tempor nisl. Sed maximus pellentesque pharetra. Suspendisse dignissim odio nec velit efficitur, vel tempus lacus gravida. Sed in nulla ac dolor feugiat lacinia non sed elit. Praesent enim sem, tempus sed arcu eu, maximus pharetra nisi. Vestibulum sollicitudin tortor et sem consectetur, vitae tempor metus lobortis. Praesent vestibulum, ex vel vestibulum iaculis, nisl odio malesuada nunc, a posuere neque tortor eu neque. Etiam mattis ultrices rutrum.

Etiam magna metus, scelerisque ut maximus quis, vulputate ac nulla. Mauris tincidunt enim diam, id maximus velit convallis at. Phasellus mattis, orci quis viverra bibendum, turpis velit aliquet nulla, et pellentesque lacus risus vel lorem. Mauris consequat tortor eu consectetur blandit. Proin maximus, dolor vitae dignissim volutpat, velit sapien tempus enim, eget sagittis erat lorem sed velit. Maecenas leo felis, elementum id urna nec, mattis vestibulum ex. Morbi pellentesque quam et erat laoreet faucibus.

Donec id leo quam. Cras mauris lacus, fringilla in fermentum quis, rutrum pretium nibh. Proin euismod mi magna, a imperdiet felis convallis ut. In mollis, sapien laoreet tristique lobortis, dui mi tincidunt dolor, ac fringilla tortor lectus sed purus. Aenean eget dui ut tellus convallis malesuada. Cras diam dui, efficitur et feugiat sed, condimentum nec nulla. Pellentesque quis diam sit amet purus accumsan congue id a neque. Proin ac fringilla ligula. Sed sit amet purus felis. Vivamus facilisis dolor id viverra maximus. Ut ut porta lacus. Etiam in dui odio.`,
		},
	],
};

export const dataWithMultipleMessagesAndABigMessage = {
	agent: {
		name: 'Juanito De Ponce',
		username: 'juanito.ponce',
	},
	visitor: {
		name: 'Christian Castro',
		username: 'christian.castro',
	},
	siteName: 'Rocket.Chat',
	closedAt: '2022-11-21T00:00:00.000Z',
	dateFormat: 'MMM D, YYYY',
	timeAndDateFormat: 'MMM D, YYYY H:mm:ss',
	timezone: 'Etc/GMT+1',
	translations: [
		{
			key: 'Agent',
			value: 'Agent',
		},
		{
			key: 'Date',
			value: 'Date',
		},
		{
			key: 'Customer',
			value: 'Customer',
		},
		{
			key: 'Chat_transcript',
			value: 'Chat transcript',
		},
		{
			key: 'Time',
			value: 'Time',
		},
		{
			key: 'This_attachment_is_not_supported',
			value: 'Attachment format not supported',
		},
	],
	messages: [
		{
			ts: '2022-11-21T16:00:00.000Z',
			u: {
				_id: '123',
				name: 'Juanito De Ponce',
				username: 'juanito.ponce',
			},
			msg: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in massa ullamcorper diam semper lobortis vitae non ex. Donec vitae nunc neque. Suspendisse aliquet luctus mauris ut scelerisque. Cras quis consectetur ex. Praesent sodales id augue in venenatis. Duis nisl magna, pharetra eu odio sit amet, venenatis accumsan erat. Donec euismod feugiat diam ac congue. Proin aliquet porta consectetur. Etiam hendrerit arcu urna.

Maecenas pretium, sem non eleifend sodales, sapien ligula sollicitudin mauris, vel imperdiet risus mi id neque. Duis tincidunt volutpat odio sit amet sodales. Sed in risus elementum, posuere nibh ut, lobortis lacus. Nulla blandit mi eget libero blandit ultricies. Etiam ut velit dui. Nunc sit amet finibus turpis, in mollis tellus. Sed commodo augue non ligula pulvinar semper. Cras a sollicitudin turpis. Duis faucibus mattis facilisis. Proin sit amet dui et velit cursus tincidunt et eget elit.

Cras sollicitudin elit nec dui accumsan pellentesque. Aenean semper tortor nisl, non tempor risus ornare sed. Duis fringilla tincidunt nulla, vitae pellentesque eros consectetur ac. Nunc neque velit, feugiat vitae mi nec, finibus imperdiet dolor. Morbi aliquet sit amet purus rutrum accumsan. Nunc ultrices odio non purus lobortis consectetur. Vivamus blandit convallis nisl, id viverra ligula congue a. Vivamus auctor nulla vitae turpis porttitor, at viverra dolor convallis. Vestibulum vel vestibulum nibh. Donec dignissim tortor blandit, porta metus sit amet, condimentum dui.

Cras id lectus nunc. Praesent in luctus lacus. Duis venenatis tempor tincidunt. Proin rhoncus malesuada nulla imperdiet varius. Etiam scelerisque euismod ex id porta. Integer finibus sit amet ex non pellentesque. Integer posuere semper massa. Morbi vel quam vitae lectus scelerisque semper. Interdum et malesuada fames ac ante ipsum primis in faucibus.

Donec lorem lacus, consequat et aliquam id, vestibulum id ipsum. Phasellus mi erat, cursus a leo a, commodo dapibus sapien. Morbi volutpat erat quam, quis lobortis mauris gravida ut. Nullam vitae enim sit amet turpis luctus ultrices. Nulla ac ante tristique, suscipit purus id, finibus nisi. Aliquam posuere nibh nisl, et ullamcorper lorem malesuada nec. Sed volutpat molestie lacus ornare maximus. Mauris porttitor pharetra mauris quis aliquet. Nullam malesuada purus sem, vitae bibendum leo posuere eu. Donec urna nibh, ultrices tempor gravida sed, condimentum a sapien.

Duis efficitur sit amet elit a maximus. Nunc vel lacus justo. In accumsan, nisl vel sollicitudin convallis, purus libero iaculis nulla, vitae egestas urna lorem sed ante. Etiam quis luctus lacus. Donec velit dui, feugiat a lacinia a, mattis sed felis. Curabitur nisl leo, hendrerit eget accumsan id, lacinia nec velit. Suspendisse sagittis augue a justo pellentesque, non dictum purus pulvinar. Morbi eleifend sit amet nunc sit amet aliquet. Proin posuere dapibus blandit. Suspendisse vel sapien id nisi tempus ornare placerat lobortis mauris. Ut lacinia egestas sem, at lobortis nisl elementum id. Vestibulum mattis metus mi, ut pellentesque metus ultricies eu. Phasellus sed nisi sit amet mauris semper fermentum. Suspendisse ut placerat risus.


Nullam mattis sit amet magna ut condimentum. Morbi posuere in lectus vitae tincidunt. Aliquam accumsan fermentum lorem, eget iaculis magna iaculis et. Nulla dignissim vitae enim id viverra. Phasellus sapien ante, egestas et elit id, facilisis hendrerit ligula. Phasellus eleifend diam nisi, sit amet pretium ex interdum tempor. Fusce vitae lobortis ligula. Sed aliquam nisl at tellus varius, eu mollis ante ultricies. Sed et ligula elementum, euismod erat viverra, pellentesque turpis. Maecenas sagittis vestibulum justo, ac convallis ex tincidunt imperdiet. Donec vehicula lacinia lacus, vitae luctus nisi faucibus et. Quisque sollicitudin imperdiet maximus. Suspendisse dignissim orci vel placerat tristique. Morbi viverra ullamcorper neque, ut varius nisl congue sit amet. Mauris sed mauris vel nibh iaculis pulvinar eget vel dui. Maecenas ac enim velit.

Cras et luctus ante. Sed gravida ipsum sit amet odio blandit aliquet. Vivamus ac sagittis ipsum, quis tempor nisl. Sed maximus pellentesque pharetra. Suspendisse dignissim odio nec velit efficitur, vel tempus lacus gravida. Sed in nulla ac dolor feugiat lacinia non sed elit. Praesent enim sem, tempus sed arcu eu, maximus pharetra nisi. Vestibulum sollicitudin tortor et sem consectetur, vitae tempor metus lobortis. Praesent vestibulum, ex vel vestibulum iaculis, nisl odio malesuada nunc, a posuere neque tortor eu neque. Etiam mattis ultrices rutrum.

Etiam magna metus, scelerisque ut maximus quis, vulputate ac nulla. Mauris tincidunt enim diam, id maximus velit convallis at. Phasellus mattis, orci quis viverra bibendum, turpis velit aliquet nulla, et pellentesque lacus risus vel lorem. Mauris consequat tortor eu consectetur blandit. Proin maximus, dolor vitae dignissim volutpat, velit sapien tempus enim, eget sagittis erat lorem sed velit. Maecenas leo felis, elementum id urna nec, mattis vestibulum ex. Morbi pellentesque quam et erat laoreet faucibus.

Donec id leo quam. Cras mauris lacus, fringilla in fermentum quis, rutrum pretium nibh. Proin euismod mi magna, a imperdiet felis convallis ut. In mollis, sapien laoreet tristique lobortis, dui mi tincidunt dolor, ac fringilla tortor lectus sed purus. Aenean eget dui ut tellus convallis malesuada. Cras diam dui, efficitur et feugiat sed, condimentum nec nulla. Pellentesque quis diam sit amet purus accumsan congue id a neque. Proin ac fringilla ligula. Sed sit amet purus felis. Vivamus facilisis dolor id viverra maximus. Ut ut porta lacus. Etiam in dui odio.`,
		},
		{
			msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit Donec id leo quam Cras mauris lacus, fringilla in fermentum quis, rutrum pretium nibh. Proin euismod mi magna, a imperdiet felis convallis ut. In mollis, sapien laoreet tristique lobortis, dui mi tincidunt dolor, ac fringilla tortor lectus sed purus. Aenean eget dui ut tellus convallis malesuada. Cras diam dui, efficitur et feugiat sed, condimentum nec nulla. Pellentesque quis diam sit amet purus accumsan congue id a neque. Proin ac fringilla ligula. Sed sit amet purus felis. Vivamus facilisis dolor id viverra maximus. Ut ut porta lacus. Etiam in ',
			ts: '2022-11-21T16:00:00.000Z',
			u: {
				_id: '321',
				name: 'Christian Castro',
				username: 'cristiano.castro',
			},
		},
		{
			msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
			ts: '2022-11-21T16:00:00.000Z',
			u: {
				_id: '321',
				name: 'Christian Castro',
				username: 'cristiano.castro',
			},
		},
	],
};

export const dataWithASingleMessageAndAnImage = {
	agent: {
		name: 'Juanito De Ponce',
		username: 'juanito.ponce',
	},
	visitor: {
		name: 'Christian Castro',
		username: 'christian.castro',
	},
	siteName: 'Rocket.Chat',
	closedAt: '2022-11-21T00:00:00.000Z',
	dateFormat: 'MMM D, YYYY',
	timeAndDateFormat: 'MMM D, YYYY H:mm:ss',
	timezone: 'Etc/GMT+1',
	translations: [
		{
			key: 'Agent',
			value: 'Agent',
		},
		{
			key: 'Date',
			value: 'Date',
		},
		{
			key: 'Customer',
			value: 'Customer',
		},
		{
			key: 'Chat_transcript',
			value: 'Chat transcript',
		},
		{
			key: 'Time',
			value: 'Time',
		},
		{
			key: 'This_attachment_is_not_supported',
			value: 'Attachment format not supported',
		},
	],
	messages: [
		{
			ts: '2022-11-21T16:00:00.000Z',
			u: {
				_id: '123',
				name: 'Juanito De Ponce',
				username: 'juanito.ponce',
			},
			msg: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in massa ullamcorper diam semper lobortis vitae non ex. Donec vitae nunc neque. Suspendisse aliquet luctus mauris ut scelerisque. Cras quis consectetur ex. Praesent sodales id augue in venenatis. Duis nisl magna, pharetra eu odio sit amet, venenatis accumsan erat. Donec euismod feugiat diam ac congue. Proin aliquet porta consectetur. Etiam hendrerit arcu urna.

Maecenas pretium, sem non eleifend sodales, sapien ligula sollicitudin mauris, vel imperdiet risus mi id neque. Duis tincidunt volutpat odio sit amet sodales. Sed in risus elementum, posuere nibh ut, lobortis lacus. Nulla blandit mi eget libero blandit ultricies. Etiam ut velit dui. Nunc sit amet finibus turpis, in mollis tellus. Sed commodo augue non ligula pulvinar semper. Cras a sollicitudin turpis. Duis faucibus mattis facilisis. Proin sit amet dui et velit cursus tincidunt et eget elit. Lorem ipsum dolor sit amet, consectetur adipiscin elit. Aliquam in massa ullamcorper diam semper lobortis viatae non ex. Donec vitae nunc neque. Suspendisse aliquet lucturs mauris ut sceleris que. Cras quis consectetur ex. Praesent sodales id auguge in venenatis. Duis nis`,
			files: [{ name: 'screenshot.png', buffer: Buffer.from(base64Image, 'base64') }],
		},
	],
};

export const dataWithASingleSystemMessage = {
	agent: {
		name: 'Juanito De Ponce',
		username: 'juanito.ponce',
	},
	visitor: {
		name: 'Christian Castro',
		username: 'christian.castro',
	},
	siteName: 'Rocket.Chat',
	closedAt: '2022-11-21T00:00:00.000Z',
	dateFormat: 'MMM D, YYYY',
	timeAndDateFormat: 'MMM D, YYYY H:mm:ss',
	timezone: 'Etc/GMT+1',
	translations: [
		{
			key: 'Agent',
			value: 'Agent',
		},
		{
			key: 'Date',
			value: 'Date',
		},
		{
			key: 'Customer',
			value: 'Customer',
		},
		{
			key: 'Chat_transcript',
			value: 'Chat transcript',
		},
		{
			key: 'Time',
			value: 'Time',
		},
		{
			key: 'This_attachment_is_not_supported',
			value: 'Attachment format not supported',
		},
	],
	messages: [
		{
			ts: '2022-11-21T16:00:00.000Z',
			u: {
				_id: '123',
				name: 'Juanito De Ponce',
				username: 'juanito.ponce',
			},
			t: 'livechat-started',
			msg: 'livechat started',
		},
	],
};

export const dataWith2ReallyBigMessages = {
	agent: {
		name: 'Juanito De Ponce',
		username: 'juanito.ponce',
	},
	visitor: {
		name: 'Christian Castro',
		username: 'christian.castro',
	},
	siteName: 'Rocket.Chat',
	closedAt: '2022-11-21T00:00:00.000Z',
	dateFormat: 'MMM D, YYYY',
	timeAndDateFormat: 'MMM D, YYYY H:mm:ss',
	timezone: 'Etc/GMT+1',
	translations: [
		{
			key: 'Agent',
			value: 'Agent',
		},
		{
			key: 'Date',
			value: 'Date',
		},
		{
			key: 'Customer',
			value: 'Customer',
		},
		{
			key: 'Chat_transcript',
			value: 'Chat transcript',
		},
		{
			key: 'Time',
			value: 'Time',
		},
		{
			key: 'This_attachment_is_not_supported',
			value: 'Attachment format not supported',
		},
	],
	messages: [
		{
			_id: 'nDYb7NKuL3T7RL6Wg',
			rid: 'Zyutf8db4pSn3qbW4',
			msg: 'Guten Tag alle! Ich brauche eine kleine Hilfe mit der TechSuiteX Anwendung.',
			ts: '2025-04-02T12:55:06.279Z',
			u: {
				_id: '67e6671d9ddc2fe11b73ec5b',
				username: 'Guest',
				name: 'Anonymous User',
			},
			md: [
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: 'Guten Tag alle! ',
						},
						{
							type: 'EMOJI',
							value: {
								type: 'PLAIN_TEXT',
								value: ':)',
							},
							shortCode: 'slight_smile',
						},
						{
							type: 'PLAIN_TEXT',
							value: ' Ich brauche eine kleine Hilfe mit der TechSuiteX Anwendung.',
						},
					],
				},
			],
			files: [],
			quotes: [],
		},
		{
			_id: 'vM2j9MFa4aXQukWJG',
			rid: 'Zyutf8db4pSn3qbW4',
			msg: 'Könntet ihr mir die Mindestvoraussetzungen für V2.0 mitteilen? Und ebenso die Spezifikationen für V2.3? Wir planen die Anschaffung eines stärkeren Computers, und unser IT-Team hat nach den Details gefragt.',
			ts: '2025-04-02T12:56:32.098Z',
			u: {
				_id: '67e6671d9ddc2fe11b73ec5b',
				username: 'Guest',
				name: 'Anonymous User',
			},
			md: [
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value:
								'Könntet ihr mir die Mindestvoraussetzungen für V2.0 mitteilen? Und ebenso die Spezifikationen für V2.3? Wir planen die Anschaffung eines stärkeren Computers, und unser IT-Team hat nach den Details gefragt.',
						},
					],
				},
			],
			files: [],
			quotes: [],
		},
		{
			_id: 'T8nHTGt6TnuoSJqCj',
			rid: 'Zyutf8db4pSn3qbW4',
			msg: 'Willkommen bei der TechSupport Kundenhotline!',
			ts: '2025-04-02T12:58:36.380Z',
			u: {
				_id: 'K4hFYDc2aFXhcRPGj',
				username: 'User123',
				name: 'Anonymous User',
			},
			md: [
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: 'Willkommen bei der TechSupport Kundenhotline!',
						},
					],
				},
			],
			files: [],
			quotes: [],
		},
		{
			_id: 'YCXWJ32cFSPdxwuX8',
			rid: 'Zyutf8db4pSn3qbW4',
			msg: 'Guten Tag, danke für Ihre Nachricht. Ich stehe Ihnen im Support-Chat zur Verfügung.',
			ts: '2025-04-02T12:58:50.921Z',
			u: {
				_id: 'K4hFYDc2aFXhcRPGj',
				username: 'KosuchK',
				name: 'Kosuch, Karl-Heinz',
			},
			md: [
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: 'Guten Tag, danke für Ihre Nachricht. Ich stehe Ihnen im Support-Chat zur Verfügung.',
						},
					],
				},
			],
			files: [],
			quotes: [],
		},
		{
			_id: 'QvoAfRg4AAXCCgFuE',
			rid: 'Zyutf8db4pSn3qbW4',
			msg: 'Here are the system requirements for the application:\n\n1. Hardware Requirements\n\nMinimum system requirements:\n• Standard PC with Intel processor, at least 3.1 GHz\n• 4 GB RAM\n• At least 10 GB of free disk space\n• Screen resolution of at least 1280 x 768 pixels and 65k colors\n• DVD drive for installation (USB installation possible)\n• Required interfaces for peripherals: RS-232, Ethernet, USB 2.0\n• Printer: Any OS-supported printer\n\n¹ Adapter required if no free RS-232 port is available.\n² Ethernet adapter required if no free port is available.\n\nRecommended system:\n• Intel Core i5, 3.4 GHz\n• 8 GB (preferably 16 GB) RAM\n• 500 GB SSD storage\n• Screen resolution of 1920 x 1080 pixels\n• DVD drive\n• 1 serial RS-232 interface\n• 2 × 1-Gbit Ethernet interfaces\n\nSpecial requirements apply for advanced peripherals.\n\n2. Software Requirements\n\n• Operating Systems:\n  - Windows 7 / 8 / 8.1 / 10 (latest service pack recommended)\n  - Future versions will support only Windows 10.\n  - Graphics driver must support OpenGL V2.1 or higher.\n\n• Media Player:\n  - Some OS versions do not include the default media player.\n\n• Office Integration:\n  - Spreadsheet and document software must be installed to use export features.',
			ts: '2025-04-02T13:01:04.324Z',
			u: {
				_id: 'K4hFYDc2aFXhcRPGj',
				username: 'User123',
				name: 'Anonymous User',
			},
			md: [
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'Here are the system requirements for the application' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '1. Hardware Requirements' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'Minimum system requirements:' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Standard PC with Intel processor, at least 3.1 GHz' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• 4 GB RAM' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• At least 10 GB of free disk space' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Screen resolution of at least 1280 x 768 pixels and 65k colors' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• DVD drive for installation (USB installation possible)' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Required interfaces: RS-232, Ethernet, USB 2.0' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Printer: Any OS-supported printer' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '¹ Adapter required if no free RS-232 port is available.' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '² Ethernet adapter required if no free port is available.' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'Recommended system:' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Intel Core i5, 3.4 GHz' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• 8 GB (preferably 16 GB) RAM' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• 500 GB SSD storage' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Screen resolution of 1920 x 1080 pixels' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• DVD drive' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• 1 serial RS-232 interface' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• 2 × 1-Gbit Ethernet interfaces' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'Special requirements apply for advanced peripherals.' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '2. Software Requirements' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Operating Systems:' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '  - Windows 7 / 8 / 8.1 / 10 (latest service pack recommended)' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '  - Future versions will support only Windows 10.' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '  - Graphics driver must support OpenGL V2.1 or higher.' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Media Player:' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '  - Some OS versions do not include the default media player.' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Office Integration:' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Office Integration:' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Office Integration:' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Office Integration:' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Office Integration:' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Office Integration:' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Office Integration:' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Office Integration:' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Office Integration:' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Office Integration:' }] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '• Office Integration:' }] },
				{
					type: 'PARAGRAPH',
					value: [{ type: 'PLAIN_TEXT', value: '  - Spreadsheet and document software must be installed to use export features.' }],
				},
			],
		},
		{
			_id: 'b8mMFBNoDe6umGP6e',
			rid: 'Zyutf8db4pSn3qbW4',
			msg: 'Here are the system requirements for Application X V1.91\n1. Hardware Requirements\n\nRecommended System:\n• Intel Core-i5, 3.4 GHz (Turbo > 4 GHz)\n• 16 GB RAM\n• 500 GB SSD\n• Screen resolution 1920 x 1080\n• 2 * 1-Gbit Ethernet interfaces (Communication with test machine and company network)\n(• USB 2.0 interfaces when using USB devices)\n(• RS-232 interfaces when using RS-232 devices; USB-RS-232 adapter possible)\n\nSpecial requirements apply when using additional peripherals or starting multiple devices at once.\nSince 1.9.2024, Application X is available as a download from the customer portal and can be downloaded. No DVD is included by default.\n(https://www.example.com/)\n\n2. Software Requirements\n\n• Operating Systems:\n  - Microsoft Windows 11 from Application X V1.6\n  - Microsoft Windows 7 up to Application X V1.5\n  - Microsoft Windows 10 for all Application X versions\n\nIt is generally recommended to install the latest service pack for the operating system.\n\n• Required Programs:\n  - Media Player\n  - Microsoft Excel or Word if using optional export interfaces for these types',
			ts: '2025-04-02T13:03:06.045Z',
			u: {
				_id: 'K4hFYDc2aFXhcRPGj',
				username: 'User123',
				name: 'Anonymous User',
			},
			md: [
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: 'Here are the system requirements for Application X V1.91',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '1. Hardware Requirements',
						},
					],
				},
				{
					type: 'LINE_BREAK',
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: 'Recommended System:',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '• Intel Core-i5, 3.4 GHz (Turbo > 4 GHz)',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '• 16 GB RAM',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '• 500 GB SSD',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '• Screen resolution 1920 x 1080',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '• 2 * 1-Gbit Ethernet interfaces (Communication with test machine and company network)',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '(• USB 2.0 interfaces when using USB devices)',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '(• RS-232 interfaces when using RS-232 devices; USB-RS-232 adapter possible)',
						},
					],
				},
				{
					type: 'LINE_BREAK',
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: 'Special requirements apply when using additional peripherals or starting multiple devices at once.',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value:
								'Since 1.9.2024, Application X is available as a download from the customer portal and can be downloaded. No DVD is included by default.',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '(https://www.example.com/)',
						},
					],
				},
				{
					type: 'LINE_BREAK',
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '2. Software Requirements',
						},
					],
				},
				{
					type: 'LINE_BREAK',
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '• Operating Systems:',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '  - Microsoft Windows 11 from Application X V1.6',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '  - Microsoft Windows 7 up to Application X V1.5',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '  - Microsoft Windows 10 for all Application X versions',
						},
					],
				},
				{
					type: 'LINE_BREAK',
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: 'It is generally recommended to install the latest service pack for the operating system.',
						},
					],
				},
				{
					type: 'LINE_BREAK',
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '• Required Programs:',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '  - Media Player',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '(  - Microsoft Excel or Word if using optional export interfaces for these types)',
						},
					],
				},
			],
			files: [],
			quotes: [],
		},
		{
			_id: 'b8mMFBNoDe6umGP6e',
			rid: 'Zyutf8db4pSn3qbW4',
			msg: 'Here are the system requirements for Application X V1.91\n1. Hardware Requirements\n\nRecommended System:\n• Intel Core-i5, 3.4 GHz (Turbo > 4 GHz)\n• 16 GB RAM\n• 500 GB SSD\n• Screen resolution 1920 x 1080\n• 2 * 1-Gbit Ethernet interfaces (Communication with test machine and company network)\n(• USB 2.0 interfaces when using USB devices)\n(• RS-232 interfaces when using RS-232 devices; USB-RS-232 adapter possible)\n\nSpecial requirements apply when using additional peripherals or starting multiple devices at once.\nSince 1.9.2024, Application X is available as a download from the customer portal and can be downloaded. No DVD is included by default.\n(https://www.example.com/)\n\n2. Software Requirements\n\n• Operating Systems:\n  - Microsoft Windows 11 from Application X V1.6\n  - Microsoft Windows 7 up to Application X V1.5\n  - Microsoft Windows 10 for all Application X versions\n\nIt is generally recommended to install the latest service pack for the operating system.\n\n• Required Programs:\n  - Media Player\n  - Microsoft Excel or Word if using optional export interfaces for these types',
			ts: '2025-04-02T13:03:06.045Z',
			u: {
				_id: 'K4hFYDc2aFXhcRPGj',
				username: 'User123',
				name: 'Anonymous User',
			},
			md: [
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: 'Here are the system requirements for Application X V1.91',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '1. Hardware Requirements',
						},
					],
				},
				{
					type: 'LINE_BREAK',
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: 'Recommended System:',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '• Intel Core-i5, 3.4 GHz (Turbo > 4 GHz)',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '• 16 GB RAM',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '• 500 GB SSD',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '• Screen resolution 1920 x 1080',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '• 2 * 1-Gbit Ethernet interfaces (Communication with test machine and company network)',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '(• USB 2.0 interfaces when using USB devices)',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '(• RS-232 interfaces when using RS-232 devices; USB-RS-232 adapter possible)',
						},
					],
				},
				{
					type: 'LINE_BREAK',
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: 'Special requirements apply when using additional peripherals or starting multiple devices at once.',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value:
								'Since 1.9.2024, Application X is available as a download from the customer portal and can be downloaded. No DVD is included by default.',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '(https://www.example.com/)',
						},
					],
				},
				{
					type: 'LINE_BREAK',
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '2. Software Requirements',
						},
					],
				},
				{
					type: 'LINE_BREAK',
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '• Operating Systems:',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '  - Microsoft Windows 11 from Application X V1.6',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '  - Microsoft Windows 7 up to Application X V1.5',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '  - Microsoft Windows 10 for all Application X versions',
						},
					],
				},
				{
					type: 'LINE_BREAK',
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: 'It is generally recommended to install the latest service pack for the operating system.',
						},
					],
				},
				{
					type: 'LINE_BREAK',
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '• Required Programs:',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '  - Media Player',
						},
					],
				},
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '(  - Microsoft Excel or Word if using optional export interfaces for these types)',
						},
					],
				},
			],
			files: [],
			quotes: [],
		},
	],
};
