import type { ActionableElement } from '../blocks/ActionableElement';
import type { Option } from '../blocks/Option';
import type { ButtonElement } from '../blocks/elements/ButtonElement';
import type { ChannelsSelectElement } from '../blocks/elements/ChannelsSelectElement';
import type { CheckboxElement } from '../blocks/elements/CheckboxElement';
import type { ConversationsSelectElement } from '../blocks/elements/ConversationsSelectElement';
import type { DatePickerElement } from '../blocks/elements/DatePickerElement';
import type { DateTimePickerElement } from '../blocks/elements/DateTimePickerElement';
import type { EmailTextInputElement } from '../blocks/elements/EmailTextInputElement';
import type { LinearScaleElement } from '../blocks/elements/LinearScaleElement';
import type { MultiChannelsSelectElement } from '../blocks/elements/MultiChannelsSelectElement';
import type { MultiConversationsSelectElement } from '../blocks/elements/MultiConversationsSelectElement';
import type { MultiStaticSelectElement } from '../blocks/elements/MultiStaticSelectElement';
import type { MultiUsersSelectElement } from '../blocks/elements/MultiUsersSelectElement';
import type { NumberInputElement } from '../blocks/elements/NumberInputElement';
import type { OverflowElement } from '../blocks/elements/OverflowElement';
import type { PlainTextInputElement } from '../blocks/elements/PlainTextInputElement';
import type { RadioButtonElement } from '../blocks/elements/RadioButtonElement';
import type { StaticSelectElement } from '../blocks/elements/StaticSelectElement';
import type { TimePickerElement } from '../blocks/elements/TimePickerElement';
import type { ToggleSwitchElement } from '../blocks/elements/ToggleSwitchElement';
import type { UrlTextInputElement } from '../blocks/elements/UrlTextInputElement';
import type { UsersSelectElement } from '../blocks/elements/UsersSelectElement';

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
												: TElement extends NumberInputElement | EmailTextInputElement | UrlTextInputElement
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
