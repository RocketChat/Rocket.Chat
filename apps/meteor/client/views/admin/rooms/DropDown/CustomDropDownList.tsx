import { Box, CheckBox, Option, Tile } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FormEvent } from 'react';
import React, { Fragment } from 'react';

import type { OptionProp } from './CustomDropDown';

export const CustomDropDownList = ({
	options,
	onSelected,
}: {
	options: OptionProp[];
	onSelected: (item: OptionProp, e?: FormEvent<HTMLElement>) => void;
}) => {
	const t = useTranslation();

	return (
		<Tile overflow='auto' pb='x12' pi={0} elevation='2' w='full' bg='light' borderRadius='x2'>
			{options.map((option) => (
				<Fragment key={option.id}>
					{option.isGroupTitle ? (
						<Box pi='x16' pbs='x8' pbe='x4' fontScale='p2b' color='default'>
							{t(option.text as TranslationKey)}
						</Box>
					) : (
						<Option key={option.id} onClick={(): void => onSelected(option)}>
							<Box pi='x8' w='full' justifyContent='space-between' display='inline-flex'>
								{t(option.text as TranslationKey)}

								<CheckBox checked={option.checked} onChange={(e): void => onSelected(option, e)} />
							</Box>
						</Option>
					)}
				</Fragment>
			))}
		</Tile>
	);
};
