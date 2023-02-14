import { Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import VerticalBarClose from '../../../../components/VerticalBar/VerticalBarClose';
import VerticalBarContent from '../../../../components/VerticalBar/VerticalBarContent';
import VerticalBarHeader from '../../../../components/VerticalBar/VerticalBarHeader';
import VerticalBarIcon from '../../../../components/VerticalBar/VerticalBarIcon';
import VerticalBarText from '../../../../components/VerticalBar/VerticalBarText';
import { useTabBarClose } from '../../contexts/ToolboxContext';
import MessageSearchPanel from './components/MessageSearchPanel';
import { useMessageSearchProviderQuery } from './hooks/useMessageSearchProviderQuery';

const MessageSearchTab = () => {
	const providerQuery = useMessageSearchProviderQuery();

	const tabBarClose = useTabBarClose();
	const handleCloseButtonClick = useCallback(() => {
		tabBarClose();
	}, [tabBarClose]);

	const t = useTranslation();

	return (
		<>
			<VerticalBarHeader>
				<VerticalBarIcon name='magnifier' />
				<VerticalBarText>{t('Search_Messages')}</VerticalBarText>
				<VerticalBarClose onClick={handleCloseButtonClick} />
			</VerticalBarHeader>
			<VerticalBarContent flexShrink={1} flexGrow={1} paddingInline={0}>
				{providerQuery.isSuccess && <MessageSearchPanel provider={providerQuery.data} />}
				{providerQuery.isError && (
					<Callout m={24} type='danger'>
						{t('Search_current_provider_not_active')}
					</Callout>
				)}
			</VerticalBarContent>
		</>
	);
};

export default MessageSearchTab;
