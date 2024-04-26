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
					name: 'Transcript_Another test_4/24/2024_Alayna.pdf',
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
					name: 'Transcript_Another test_4/24/2024_Alayna.pdf',
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
