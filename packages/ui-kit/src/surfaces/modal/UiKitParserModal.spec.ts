import type { OverflowElement } from '../../blocks/elements/OverflowElement';
import type { PlainText } from '../../blocks/text/PlainText';
import { BlockContext } from '../../rendering/BlockContext';
import { UiKitParserModal } from './UiKitParserModal';
import { uiKitModal } from './uiKitModal';

class TestParser extends UiKitParserModal<unknown> {
	plain_text = (element: any, context: any, index: any): any => ({
		component: 'text',
		props: {
			key: index,
			children: element.text,
			emoji: element.emoji,
			block: context === BlockContext.BLOCK,
		},
	});

	mrkdwn = (element: any, context: any, index: any): any => ({
		component: 'markdown',
		props: {
			key: index,
			children: element.text,
			verbatim: Boolean(element.verbatim),
			block: context === BlockContext.BLOCK,
		},
	});

	divider = (_element: any, context: any, index: any): any => ({
		component: 'divider',
		props: {
			key: index,
			block: context === BlockContext.BLOCK,
		},
	});

	section = (element: any, context: any, index: any): any => {
		let key = 0;
		return {
			component: 'section',
			props: {
				key: index,
				children: [
					...(element.text ? [this.text(element.text, BlockContext.SECTION, key++)] : []),
					...(element.fields?.map((field: any) => this.text(field, BlockContext.SECTION, key++)) ?? []),
					...(element.accessory ? [this.renderAccessories(element.accessory, BlockContext.SECTION, undefined, key++)] : []),
				],
				block: context === BlockContext.BLOCK,
			},
		};
	};

	actions = (element: any, context: any, index: any): any => ({
		component: 'actions',
		props: {
			key: index,
			children: element.elements.map((element: any, key: number) => this.renderActions(element, BlockContext.ACTION, undefined, key)),
			block: context === BlockContext.BLOCK,
		},
	});

	context = (element: any, context: any, index: any): any => ({
		component: 'context',
		props: {
			key: index,
			children: element.elements.map((element: any, key: number) => this.renderContext(element, BlockContext.CONTEXT, undefined, key)),
			block: context === BlockContext.BLOCK,
		},
	});

	input = (element: any, context: any, index: any): any => ({
		component: 'input-group',
		props: {
			key: index,
			children: [
				this.plainText(element.label, BlockContext.FORM, 0),
				this.renderInputs(element.element, BlockContext.FORM, undefined, 1),
				...(element.hint ? [this.plainText(element.hint, BlockContext.FORM, 2)] : []),
			],
			block: context === BlockContext.BLOCK,
		},
	});

	button = (element: any, context: any, index: any): any => ({
		component: 'button',
		props: {
			key: index,
			children: element.text ? [this.text(element.text, BlockContext.SECTION, 0)] : [],
			...(element.url && { href: element.url }),
			...(element.value && { value: element.value }),
			variant: element.style ?? 'normal',
			block: context === BlockContext.BLOCK,
		},
	});

	image = (element: any, context: any, index: any): any => {
		if (context === BlockContext.BLOCK) {
			let key = 0;
			return {
				component: 'image-container',
				props: {
					key: index,
					children: [
						{
							component: 'image',
							props: {
								key: key++,
								src: element.imageUrl,
								alt: element.altText,
								block: false,
							},
						},
						...(element.title ? [this.plainText(element.title, -1, key++)] : []),
					],
					block: true,
				},
			};
		}

		return {
			component: 'image',
			props: {
				key: index,
				src: element.imageUrl,
				alt: element.altText,
				block: false,
			},
		};
	};

	overflow = (element: OverflowElement, _context: any, index: any): any => ({
		component: 'menu',
		props: {
			key: index,
			children: element.options.map((option, key) => ({
				component: 'menu-item',
				props: {
					key,
					children: [this.text(option.text, -1, 0), ...(option.description ? [this.plainText(option.description, -1, 1)] : [])],
					value: option.value,
					...(option.url && { url: option.url }),
				},
			})),
		},
	});

	datePicker = (element: any, _context: any, index: any): any => ({
		component: 'input',
		props: {
			key: index,
			type: 'date',
			...(element.placeholder && {
				placeholder: this.text(element.placeholder, -1, 0),
			}),
			...(element.initialDate && { defaultValue: element.initialDate }),
		},
	});

	staticSelect = (element: any, _context: any, index: any): any => ({
		component: 'select',
		props: {
			key: index,
			...(element.placeholder && {
				placeholder: this.text(element.placeholder, -1, 0),
			}),
			children: element.options.map((option: any, key: any) => ({
				component: 'option',
				props: {
					key,
					children: this.text(option.text, -1, 0),
					value: option.value,
					...(option.description && {
						description: this.text(option.description, -1, 0),
					}),
				},
			})),
			...(element.initialOption && {
				defaultValue: element.options.find((option: any) => option.value === element.initialOption.value)?.value,
			}),
		},
	});

	multiStaticSelect = (element: any, _context: any, index: any): any => ({
		component: 'select',
		props: {
			key: index,
			...(element.placeholder && {
				placeholder: this.text(element.placeholder, -1, 0),
			}),
			multiple: true,
			children: element.options.map((option: any, key: any) => ({
				component: 'option',
				props: {
					key,
					children: this.text(option.text, -1, 0),
					value: option.value,
					...(option.description && {
						description: this.text(option.description, -1, 0),
					}),
				},
			})),
			...(element.initialOptions && {
				defaultValue: element.options
					.filter((option: any) => element.initialOptions.some((initialOption: any) => option.value === initialOption.value))
					.map((option: any) => option.value),
			}),
		},
	});

	plainInput = (element: any, _context: any, index: any): any => ({
		component: 'input',
		props: {
			key: index,
			type: 'text',
			...(element.placeholder && {
				placeholder: this.plainText(element.placeholder, -1, 0),
			}),
			...(element.initialValue && { defaultValue: element.initialValue }),
			multiline: element.multiline ?? false,
			...(typeof element.minLength !== 'undefined' && {
				minLength: element.minLength,
			}),
			...(typeof element.maxLength !== 'undefined' && {
				maxLength: element.maxLength,
			}),
		},
	});

	linearScale = ({ minValue = 0, maxValue = 10 }: any, _context: any, index: any): any => ({
		component: 'linear-scale',
		props: {
			key: index,
			children: Array.from({ length: maxValue - minValue + 1 }).map((_, key: any) => ({
				component: 'linear-scale-point',
				props: {
					key,
					children: [
						this.text(
							{
								type: 'plain_text',
								text: String(minValue + key),
								emoji: true,
							} as PlainText,
							-1,
							0,
						),
					],
				},
			})),
		},
	});
}

const parser = new TestParser();
const parse = uiKitModal(parser);

const conditionalParse = uiKitModal(parser, {
	engine: 'rocket.chat',
});

describe('divider', () => {
	it('renders', () => {
		const payload = [
			{
				type: 'divider',
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'divider',
				props: {
					key: 0,
					block: true,
				},
			},
		]);
	});
});

describe('section', () => {
	it('renders text as plain_text', () => {
		const payload = [
			{
				type: 'section',
				text: {
					type: 'plain_text',
					text: 'This is a plain text section block.',
					emoji: true,
				},
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'section',
				props: {
					key: 0,
					children: [
						{
							component: 'text',
							props: {
								key: 0,
								children: 'This is a plain text section block.',
								emoji: true,
								block: false,
							},
						},
					],
					block: true,
				},
			},
		]);
	});

	it('render text as mrkdwn', () => {
		const payload = [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: 'This is a mrkdwn section block :ghost: *this is bold*, and ~this is crossed out~, and <https://google.com|this is a link>',
				},
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'section',
				props: {
					key: 0,
					children: [
						{
							component: 'markdown',
							props: {
								key: 0,
								children:
									'This is a mrkdwn section block :ghost: *this is bold*, and ~this is crossed out~, and <https://google.com|this is a link>',
								verbatim: false,
								block: false,
							},
						},
					],
					block: true,
				},
			},
		]);
	});

	it('renders text fields', () => {
		const payload = [
			{
				type: 'section',
				fields: [
					{
						type: 'plain_text',
						text: '*this is plain_text text*',
						emoji: true,
					},
					{
						type: 'plain_text',
						text: '*this is plain_text text*',
						emoji: true,
					},
					{
						type: 'plain_text',
						text: '*this is plain_text text*',
						emoji: true,
					},
					{
						type: 'plain_text',
						text: '*this is plain_text text*',
						emoji: true,
					},
					{
						type: 'plain_text',
						text: '*this is plain_text text*',
						emoji: true,
					},
				],
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'section',
				props: {
					key: 0,
					block: true,
					children: [
						{
							component: 'text',
							props: {
								key: 0,
								children: '*this is plain_text text*',
								emoji: true,
								block: false,
							},
						},
						{
							component: 'text',
							props: {
								key: 1,
								children: '*this is plain_text text*',
								emoji: true,
								block: false,
							},
						},
						{
							component: 'text',
							props: {
								key: 2,
								children: '*this is plain_text text*',
								emoji: true,
								block: false,
							},
						},
						{
							component: 'text',
							props: {
								key: 3,
								children: '*this is plain_text text*',
								emoji: true,
								block: false,
							},
						},
						{
							component: 'text',
							props: {
								key: 4,
								children: '*this is plain_text text*',
								emoji: true,
								block: false,
							},
						},
					],
				},
			},
		]);
	});

	it('renders accessory as button', () => {
		const payload = [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: 'This is a section block with a button.',
				},
				accessory: {
					type: 'button',
					text: {
						type: 'plain_text',
						text: 'Click Me',
						emoji: true,
					},
					value: 'click_me_123',
				},
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'section',
				props: {
					key: 0,
					block: true,
					children: [
						{
							component: 'markdown',
							props: {
								key: 0,
								children: 'This is a section block with a button.',
								verbatim: false,
								block: false,
							},
						},
						{
							component: 'button',
							props: {
								key: 1,
								children: [
									{
										component: 'text',
										props: {
											key: 0,
											children: 'Click Me',
											emoji: true,
											block: false,
										},
									},
								],
								value: 'click_me_123',
								variant: 'normal',
								block: false,
							},
						},
					],
				},
			},
		]);
	});

	it('renders accessory as image', () => {
		const payload = [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: 'This is a section block with an accessory image.',
				},
				accessory: {
					type: 'image',
					imageUrl: 'https://pbs.twimg.com/profile_images/625633822235693056/lNGUneLX_400x400.jpg',
					altText: 'cute cat',
				},
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'section',
				props: {
					key: 0,
					block: true,
					children: [
						{
							component: 'markdown',
							props: {
								key: 0,
								children: 'This is a section block with an accessory image.',
								verbatim: false,
								block: false,
							},
						},
						{
							component: 'image',
							props: {
								key: 1,
								src: 'https://pbs.twimg.com/profile_images/625633822235693056/lNGUneLX_400x400.jpg',
								alt: 'cute cat',
								block: false,
							},
						},
					],
				},
			},
		]);
	});

	it('renders accessory as overflow menu', () => {
		const payload = [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: 'This is a section block with an overflow menu.',
				},
				accessory: {
					type: 'overflow',
					options: [
						{
							text: {
								type: 'plain_text',
								text: '*this is plain_text text*',
								emoji: true,
							},
							value: 'value-0',
						},
						{
							text: {
								type: 'plain_text',
								text: '*this is plain_text text*',
								emoji: true,
							},
							value: 'value-1',
						},
						{
							text: {
								type: 'plain_text',
								text: '*this is plain_text text*',
								emoji: true,
							},
							value: 'value-2',
						},
						{
							text: {
								type: 'plain_text',
								text: '*this is plain_text text*',
								emoji: true,
							},
							value: 'value-3',
						},
						{
							text: {
								type: 'plain_text',
								text: '*this is plain_text text*',
								emoji: true,
							},
							value: 'value-4',
						},
					],
				},
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'section',
				props: {
					key: 0,
					block: true,
					children: [
						{
							component: 'markdown',
							props: {
								key: 0,
								children: 'This is a section block with an overflow menu.',
								verbatim: false,
								block: false,
							},
						},
						{
							component: 'menu',
							props: {
								key: 1,
								children: [
									{
										component: 'menu-item',
										props: {
											key: 0,
											children: [
												{
													component: 'text',
													props: {
														key: 0,
														children: '*this is plain_text text*',
														emoji: true,
														block: false,
													},
												},
											],
											value: 'value-0',
										},
									},
									{
										component: 'menu-item',
										props: {
											key: 1,
											children: [
												{
													component: 'text',
													props: {
														key: 0,
														children: '*this is plain_text text*',
														emoji: true,
														block: false,
													},
												},
											],
											value: 'value-1',
										},
									},
									{
										component: 'menu-item',
										props: {
											key: 2,
											children: [
												{
													component: 'text',
													props: {
														key: 0,
														children: '*this is plain_text text*',
														emoji: true,
														block: false,
													},
												},
											],
											value: 'value-2',
										},
									},
									{
										component: 'menu-item',
										props: {
											key: 3,
											children: [
												{
													component: 'text',
													props: {
														key: 0,
														children: '*this is plain_text text*',
														emoji: true,
														block: false,
													},
												},
											],
											value: 'value-3',
										},
									},
									{
										component: 'menu-item',
										props: {
											key: 4,
											children: [
												{
													component: 'text',
													props: {
														key: 0,
														children: '*this is plain_text text*',
														emoji: true,
														block: false,
													},
												},
											],
											value: 'value-4',
										},
									},
								],
							},
						},
					],
				},
			},
		]);
	});

	it('renders accessory as datepicker', () => {
		const payload = [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: 'Pick a date for the deadline.',
				},
				accessory: {
					type: 'datepicker',
					initial_date: '1990-04-28',
					placeholder: {
						type: 'plain_text',
						text: 'Select a date',
						emoji: true,
					},
				},
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'section',
				props: {
					key: 0,
					block: true,
					children: [
						{
							component: 'markdown',
							props: {
								key: 0,
								children: 'Pick a date for the deadline.',
								verbatim: false,
								block: false,
							},
						},
						{
							component: 'input',
							props: {
								key: 1,
								type: 'date',
								placeholder: {
									component: 'text',
									props: {
										key: 0,
										children: 'Select a date',
										emoji: true,
										block: false,
									},
								},
							},
						},
					],
				},
			},
		]);
	});
});

describe('image', () => {
	it('renders with title', () => {
		const payload = [
			{
				type: 'image',
				title: {
					type: 'plain_text',
					text: 'I Need a Marg',
					emoji: true,
				},
				imageUrl: 'https://assets3.thrillist.com/v1/image/1682388/size/tl-horizontal_main.jpg',
				altText: 'marg',
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'image-container',
				props: {
					key: 0,
					children: [
						{
							component: 'image',
							props: {
								key: 0,
								src: 'https://assets3.thrillist.com/v1/image/1682388/size/tl-horizontal_main.jpg',
								alt: 'marg',
								block: false,
							},
						},
						{
							component: 'text',
							props: {
								key: 1,
								children: 'I Need a Marg',
								emoji: true,
								block: false,
							},
						},
					],
					block: true,
				},
			},
		]);
	});

	it('renders with no title', () => {
		const payload = [
			{
				type: 'image',
				imageUrl: 'https://i1.wp.com/thetempest.co/wp-content/uploads/2017/08/The-wise-words-of-Michael-Scott-Imgur-2.jpg?w=1024&ssl=1',
				altText: 'inspiration',
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'image-container',
				props: {
					key: 0,
					children: [
						{
							component: 'image',
							props: {
								key: 0,
								src: 'https://i1.wp.com/thetempest.co/wp-content/uploads/2017/08/The-wise-words-of-Michael-Scott-Imgur-2.jpg?w=1024&ssl=1',
								alt: 'inspiration',
								block: false,
							},
						},
					],
					block: true,
				},
			},
		]);
	});
});

describe('actions', () => {
	it('renders all selects', () => {
		const payload = [
			{
				type: 'actions',
				elements: [
					{
						type: 'conversations_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select a conversation',
							emoji: true,
						},
					},
					{
						type: 'channels_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select a channel',
							emoji: true,
						},
					},
					{
						type: 'users_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select a user',
							emoji: true,
						},
					},
					{
						type: 'static_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select an item',
							emoji: true,
						},
						options: [
							{
								text: {
									type: 'plain_text',
									text: '*this is plain_text text*',
									emoji: true,
								},
								value: 'value-0',
							},
							{
								text: {
									type: 'plain_text',
									text: '*this is plain_text text*',
									emoji: true,
								},
								value: 'value-1',
							},
							{
								text: {
									type: 'plain_text',
									text: '*this is plain_text text*',
									emoji: true,
								},
								value: 'value-2',
							},
						],
					},
				],
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'actions',
				props: {
					key: 0,
					children: [
						null,
						null,
						null,
						{
							component: 'select',
							props: {
								key: 3,
								children: [
									{
										component: 'option',
										props: {
											key: 0,
											children: {
												component: 'text',
												props: {
													key: 0,
													children: '*this is plain_text text*',
													emoji: true,
													block: false,
												},
											},
											value: 'value-0',
										},
									},
									{
										component: 'option',
										props: {
											key: 1,
											children: {
												component: 'text',
												props: {
													key: 0,
													children: '*this is plain_text text*',
													emoji: true,
													block: false,
												},
											},
											value: 'value-1',
										},
									},
									{
										component: 'option',
										props: {
											key: 2,
											children: {
												component: 'text',
												props: {
													key: 0,
													children: '*this is plain_text text*',
													emoji: true,
													block: false,
												},
											},
											value: 'value-2',
										},
									},
								],
								placeholder: {
									component: 'text',
									props: {
										key: 0,
										children: 'Select an item',
										emoji: true,
										block: false,
									},
								},
							},
						},
					],
					block: true,
				},
			},
		]);
	});

	it('renders filtered conversations select', () => {
		const payload = [
			{
				type: 'actions',
				elements: [
					{
						type: 'conversations_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select private conversation',
							emoji: true,
						},
						filter: {
							include: ['private'],
						},
					},
				],
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'actions',
				props: {
					key: 0,
					children: [null],
					block: true,
				},
			},
		]);
	});

	it('renders selects with initial options', () => {
		const payload = [
			{
				type: 'actions',
				elements: [
					{
						type: 'conversations_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select a conversation',
							emoji: true,
						},
						initialConversation: 'D123',
					},
					{
						type: 'users_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select a user',
							emoji: true,
						},
						initialUser: 'U123',
					},
					{
						type: 'channels_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select a channel',
							emoji: true,
						},
						initialChannel: 'C123',
					},
				],
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'actions',
				props: {
					key: 0,
					children: [null, null, null],
					block: true,
				},
			},
		]);
	});

	it('renders button', () => {
		const payload = [
			{
				type: 'actions',
				elements: [
					{
						type: 'button',
						text: {
							type: 'plain_text',
							text: 'Click Me',
							emoji: true,
						},
						value: 'click_me_123',
					},
				],
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'actions',
				props: {
					key: 0,
					children: [
						{
							component: 'button',
							props: {
								key: 0,
								children: [
									{
										component: 'text',
										props: {
											key: 0,
											children: 'Click Me',
											emoji: true,
											block: false,
										},
									},
								],
								value: 'click_me_123',
								variant: 'normal',
								block: false,
							},
						},
					],
					block: true,
				},
			},
		]);
	});

	it('renders datepicker', () => {
		const payload = [
			{
				type: 'actions',
				elements: [
					{
						type: 'datepicker',
						initialDate: '1990-04-28',
						placeholder: {
							type: 'plain_text',
							text: 'Select a date',
							emoji: true,
						},
					},
					{
						type: 'datepicker',
						initialDate: '1990-04-28',
						placeholder: {
							type: 'plain_text',
							text: 'Select a date',
							emoji: true,
						},
					},
				],
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'actions',
				props: {
					key: 0,
					children: [
						{
							component: 'input',
							props: {
								key: 0,
								type: 'date',
								defaultValue: '1990-04-28',
								placeholder: {
									component: 'text',
									props: {
										key: 0,
										children: 'Select a date',
										emoji: true,
										block: false,
									},
								},
							},
						},
						{
							component: 'input',
							props: {
								key: 1,
								type: 'date',
								defaultValue: '1990-04-28',
								placeholder: {
									component: 'text',
									props: {
										key: 0,
										children: 'Select a date',
										emoji: true,
										block: false,
									},
								},
							},
						},
					],
					block: true,
				},
			},
		]);
	});
});

describe('context', () => {
	it('renders plain text', () => {
		const payload = [
			{
				type: 'context',
				elements: [
					{
						type: 'plain_text',
						text: 'Author: K A Applegate',
						emoji: true,
					},
				],
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'context',
				props: {
					key: 0,
					children: [
						{
							component: 'text',
							props: {
								key: 0,
								children: 'Author: K A Applegate',
								emoji: true,
								block: false,
							},
						},
					],
					block: true,
				},
			},
		]);
	});

	it('renders mrkdwn', () => {
		const payload = [
			{
				type: 'context',
				elements: [
					{
						type: 'image',
						imageUrl: 'https://pbs.twimg.com/profile_images/625633822235693056/lNGUneLX_400x400.jpg',
						altText: 'cute cat',
					},
					{
						type: 'mrkdwn',
						text: '*Cat* has approved this message.',
					},
				],
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'context',
				props: {
					key: 0,
					children: [
						{
							component: 'image',
							props: {
								key: 0,
								src: 'https://pbs.twimg.com/profile_images/625633822235693056/lNGUneLX_400x400.jpg',
								alt: 'cute cat',
								block: false,
							},
						},
						{
							component: 'markdown',
							props: {
								key: 1,
								children: '*Cat* has approved this message.',
								verbatim: false,
								block: false,
							},
						},
					],
					block: true,
				},
			},
		]);
	});

	it('renders text and images', () => {
		const payload = [
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: '*This* is :smile: markdown',
					},
					{
						type: 'image',
						imageUrl: 'https://pbs.twimg.com/profile_images/625633822235693056/lNGUneLX_400x400.jpg',
						altText: 'cute cat',
					},
					{
						type: 'image',
						imageUrl: 'https://pbs.twimg.com/profile_images/625633822235693056/lNGUneLX_400x400.jpg',
						altText: 'cute cat',
					},
					{
						type: 'image',
						imageUrl: 'https://pbs.twimg.com/profile_images/625633822235693056/lNGUneLX_400x400.jpg',
						altText: 'cute cat',
					},
					{
						type: 'plain_text',
						text: 'Author: K A Applegate',
						emoji: true,
					},
				],
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'context',
				props: {
					key: 0,
					children: [
						{
							component: 'markdown',
							props: {
								key: 0,
								children: '*This* is :smile: markdown',
								verbatim: false,
								block: false,
							},
						},
						{
							component: 'image',
							props: {
								key: 1,
								src: 'https://pbs.twimg.com/profile_images/625633822235693056/lNGUneLX_400x400.jpg',
								alt: 'cute cat',
								block: false,
							},
						},
						{
							component: 'image',
							props: {
								key: 2,
								src: 'https://pbs.twimg.com/profile_images/625633822235693056/lNGUneLX_400x400.jpg',
								alt: 'cute cat',
								block: false,
							},
						},
						{
							component: 'image',
							props: {
								key: 3,
								src: 'https://pbs.twimg.com/profile_images/625633822235693056/lNGUneLX_400x400.jpg',
								alt: 'cute cat',
								block: false,
							},
						},
						{
							component: 'text',
							props: {
								key: 4,
								children: 'Author: K A Applegate',
								emoji: true,
								block: false,
							},
						},
					],
					block: true,
				},
			},
		]);
	});
});

describe('input', () => {
	it('renders multiline plain text input', () => {
		const payload = [
			{
				type: 'input',
				element: {
					type: 'plain_text_input',
					multiline: true,
				},
				label: {
					type: 'plain_text',
					text: 'Label',
					emoji: true,
				},
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'input-group',
				props: {
					key: 0,
					children: [
						{
							component: 'text',
							props: {
								key: 0,
								children: 'Label',
								emoji: true,
								block: false,
							},
						},
						{
							component: 'input',
							props: {
								key: 1,
								type: 'text',
								multiline: true,
							},
						},
					],
					block: true,
				},
			},
		]);
	});

	it('renders plain text input', () => {
		const payload = [
			{
				type: 'input',
				element: {
					type: 'plain_text_input',
				},
				label: {
					type: 'plain_text',
					text: 'Label',
					emoji: true,
				},
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'input-group',
				props: {
					key: 0,
					children: [
						{
							component: 'text',
							props: {
								key: 0,
								children: 'Label',
								emoji: true,
								block: false,
							},
						},
						{
							component: 'input',
							props: {
								key: 1,
								type: 'text',
								multiline: false,
							},
						},
					],
					block: true,
				},
			},
		]);
	});

	it('renders multi users select', () => {
		const payload = [
			{
				type: 'input',
				element: {
					type: 'multi_users_select',
					placeholder: {
						type: 'plain_text',
						text: 'Select users',
						emoji: true,
					},
				},
				label: {
					type: 'plain_text',
					text: 'Label',
					emoji: true,
				},
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'input-group',
				props: {
					key: 0,
					children: [
						{
							component: 'text',
							props: {
								key: 0,
								children: 'Label',
								emoji: true,
								block: false,
							},
						},
						null,
					],
					block: true,
				},
			},
		]);
	});

	it('renders static select', () => {
		const payload = [
			{
				type: 'input',
				element: {
					type: 'static_select',
					placeholder: {
						type: 'plain_text',
						text: 'Select an item',
						emoji: true,
					},
					options: [
						{
							text: {
								type: 'plain_text',
								text: '*this is plain_text text*',
								emoji: true,
							},
							value: 'value-0',
						},
						{
							text: {
								type: 'plain_text',
								text: '*this is plain_text text*',
								emoji: true,
							},
							value: 'value-1',
						},
						{
							text: {
								type: 'plain_text',
								text: '*this is plain_text text*',
								emoji: true,
							},
							value: 'value-2',
						},
					],
				},
				label: {
					type: 'plain_text',
					text: 'Label',
					emoji: true,
				},
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'input-group',
				props: {
					key: 0,
					children: [
						{
							component: 'text',
							props: {
								key: 0,
								children: 'Label',
								emoji: true,
								block: false,
							},
						},
						{
							component: 'select',
							props: {
								key: 1,
								children: [
									{
										component: 'option',
										props: {
											key: 0,
											children: {
												component: 'text',
												props: {
													key: 0,
													children: '*this is plain_text text*',
													emoji: true,
													block: false,
												},
											},
											value: 'value-0',
										},
									},
									{
										component: 'option',
										props: {
											key: 1,
											children: {
												component: 'text',
												props: {
													key: 0,
													children: '*this is plain_text text*',
													emoji: true,
													block: false,
												},
											},
											value: 'value-1',
										},
									},
									{
										component: 'option',
										props: {
											key: 2,
											children: {
												component: 'text',
												props: {
													key: 0,
													children: '*this is plain_text text*',
													emoji: true,
													block: false,
												},
											},
											value: 'value-2',
										},
									},
								],
								placeholder: {
									component: 'text',
									props: {
										key: 0,
										children: 'Select an item',
										emoji: true,
										block: false,
									},
								},
							},
						},
					],
					block: true,
				},
			},
		]);
	});

	it('renders datepicker', () => {
		const payload = [
			{
				type: 'input',
				element: {
					type: 'datepicker',
					initialDate: '1990-04-28',
					placeholder: {
						type: 'plain_text',
						text: 'Select a date',
						emoji: true,
					},
				},
				label: {
					type: 'plain_text',
					text: 'Label',
					emoji: true,
				},
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'input-group',
				props: {
					key: 0,
					children: [
						{
							component: 'text',
							props: {
								key: 0,
								children: 'Label',
								emoji: true,
								block: false,
							},
						},
						{
							component: 'input',
							props: {
								key: 1,
								type: 'date',
								defaultValue: '1990-04-28',
								placeholder: {
									component: 'text',
									props: {
										key: 0,
										children: 'Select a date',
										emoji: true,
										block: false,
									},
								},
							},
						},
					],
					block: true,
				},
			},
		]);
	});

	it('renders linear scale', () => {
		const payload = [
			{
				type: 'input',
				element: {
					type: 'linear_scale',
					maxValue: 2,
				},
				label: {
					type: 'plain_text',
					text: 'Label',
					emoji: true,
				},
			},
		];
		expect(parse(payload)).toStrictEqual([
			{
				component: 'input-group',
				props: {
					key: 0,
					children: [
						{
							component: 'text',
							props: {
								key: 0,
								children: 'Label',
								emoji: true,
								block: false,
							},
						},
						{
							component: 'linear-scale',
							props: {
								key: 1,
								children: [
									{
										component: 'linear-scale-point',
										props: {
											key: 0,
											children: [
												{
													component: 'text',
													props: {
														key: 0,
														children: '0',
														emoji: true,
														block: false,
													},
												},
											],
										},
									},
									{
										component: 'linear-scale-point',
										props: {
											key: 1,
											children: [
												{
													component: 'text',
													props: {
														key: 0,
														children: '1',
														emoji: true,
														block: false,
													},
												},
											],
										},
									},
									{
										component: 'linear-scale-point',
										props: {
											key: 2,
											children: [
												{
													component: 'text',
													props: {
														key: 0,
														children: '2',
														emoji: true,
														block: false,
													},
												},
											],
										},
									},
								],
							},
						},
					],
					block: true,
				},
			},
		]);
	});
});

describe('conditional', () => {
	it('renders when conditions match', () => {
		const blocks = [
			{
				type: 'conditional',
				when: {
					engine: ['rocket.chat'],
				},
				render: [
					{
						type: 'section',
						text: {
							type: 'plain_text',
							text: 'This is a plain text section block.',
							emoji: true,
						},
					},
				],
			},
		];

		expect(conditionalParse(blocks)).toStrictEqual([
			{
				component: 'section',
				props: {
					key: 0,
					children: [
						{
							component: 'text',
							props: {
								key: 0,
								children: 'This is a plain text section block.',
								emoji: true,
								block: false,
							},
						},
					],
					block: true,
				},
			},
		]);
	});

	it('renders when no conditions are set', () => {
		const blocks = [
			{
				type: 'conditional',
				when: {
					engine: ['rocket.chat'],
				},
				render: [
					{
						type: 'section',
						text: {
							type: 'plain_text',
							text: 'This is a plain text section block.',
							emoji: true,
						},
					},
				],
			},
		];

		expect(parse(blocks)).toStrictEqual([
			{
				component: 'section',
				props: {
					key: 0,
					children: [
						{
							component: 'text',
							props: {
								key: 0,
								children: 'This is a plain text section block.',
								emoji: true,
								block: false,
							},
						},
					],
					block: true,
				},
			},
		]);
	});

	it('does not render when conditions match', () => {
		const blocks = [
			{
				type: 'conditional',
				when: {
					engine: ['livechat'],
				},
				render: [
					{
						type: 'section',
						text: {
							type: 'plain_text',
							text: 'This is a plain text section block.',
							emoji: true,
						},
					},
				],
			},
		];

		expect(conditionalParse(blocks)).toStrictEqual([]);
	});
});
