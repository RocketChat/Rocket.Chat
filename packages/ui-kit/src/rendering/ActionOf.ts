import type { ActionableElement } from '../blocks/ActionableElement.js';
import type { Option } from '../blocks/Option.js';
import type { ButtonElement } from '../blocks/elements/ButtonElement.js';
import type { ChannelsSelectElement } from '../blocks/elements/ChannelsSelectElement.js';
import type { CheckboxElement } from '../blocks/elements/CheckboxElement.js';
import type { ConversationsSelectElement } from '../blocks/elements/ConversationsSelectElement.js';
import type { DatePickerElement } from '../blocks/elements/DatePickerElement.js';
import type { DateTimePickerElement } from '../blocks/elements/DateTimePickerElement.js';
import type { EmailTextInputElement } from '../blocks/elements/EmailTextInputElement.js';
import type { FeedbackButtonsElement } from '../blocks/elements/FeedbackButtonsElement.js';
import type { LinearScaleElement } from '../blocks/elements/LinearScaleElement.js';
import type { MultiChannelsSelectElement } from '../blocks/elements/MultiChannelsSelectElement.js';
import type { MultiConversationsSelectElement } from '../blocks/elements/MultiConversationsSelectElement.js';
import type { MultiStaticSelectElement } from '../blocks/elements/MultiStaticSelectElement.js';
import type { MultiUsersSelectElement } from '../blocks/elements/MultiUsersSelectElement.js';
import type { NumberInputElement } from '../blocks/elements/NumberInputElement.js';
import type { OverflowElement } from '../blocks/elements/OverflowElement.js';
import type { PlainTextInputElement } from '../blocks/elements/PlainTextInputElement.js';
import type { RadioButtonElement } from '../blocks/elements/RadioButtonElement.js';
import type { StaticSelectElement } from '../blocks/elements/StaticSelectElement.js';
import type { TimePickerElement } from '../blocks/elements/TimePickerElement.js';
import type { ToggleSwitchElement } from '../blocks/elements/ToggleSwitchElement.js';
import type { UrlTextInputElement } from '../blocks/elements/UrlTextInputElement.js';
import type { UsersSelectElement } from '../blocks/elements/UsersSelectElement.js';

export type ActionOf<TElement extends ActionableElement> = TElement extends ButtonElement
	? ButtonElement['value']
	: TElement extends ChannelsSelectElement
		? Option['value']
		: TElement extends ConversationsSelectElement
			? Option['value']
			: TElement extends DatePickerElement
				? DatePickerElement['initialDate']
				: TElement extends DateTimePickerElement
					? DateTimePickerElement['initial_date_time']
					: TElement extends LinearScaleElement
						? LinearScaleElement['initialValue']
						: TElement extends MultiChannelsSelectElement
							? Option['value'][]
							: TElement extends MultiConversationsSelectElement
								? Option['value'][]
								: TElement extends MultiStaticSelectElement
									? MultiStaticSelectElement['initialValue']
									: TElement extends MultiUsersSelectElement
										? Option['value'][]
										: TElement extends OverflowElement
											? OverflowElement['options'][number]['value']
											: TElement extends PlainTextInputElement
												? PlainTextInputElement['initialValue']
												: TElement extends NumberInputElement | EmailTextInputElement | UrlTextInputElement | FeedbackButtonsElement
													? string
													: TElement extends StaticSelectElement
														? StaticSelectElement['initialValue']
														: TElement extends UsersSelectElement
															? Option['value']
															: TElement extends ToggleSwitchElement
																? Option['value'][]
																: TElement extends RadioButtonElement
																	? Option['value'] | undefined
																	: TElement extends CheckboxElement
																		? Option['value'][] | undefined
																		: TElement extends TimePickerElement
																			? TimePickerElement['initialTime']
																			: never;
