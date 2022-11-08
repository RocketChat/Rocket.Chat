import { Tooltip, Tag } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { TooltipOnHover } from './AppDetailsPage/tabs/AppStatus/TooltipOnHover';
import { App } from './types';

type BundleChipsProps = {
	bundledIn: {
		bundleId: string;
		bundleName: string;
		apps: App[];
	}[];
};

const BundleChips = ({ bundledIn }: BundleChipsProps): ReactElement => {
	const t = useTranslation();

	return (
		<>
			{bundledIn.map((bundle) => (
				<TooltipOnHover
					element={<Tag variant='primary'>{bundle.bundleName}</Tag>}
					tooltip={
						<Tooltip>
							{t('this_app_is_included_with_subscription', {
								bundleName: bundle.bundleName,
							})}
						</Tooltip>
					}
				></TooltipOnHover>
			))}
		</>
	);
};

export default BundleChips;
