import { Icon, StatesAction } from '@rocket.chat/fuselage';
import { ServerContext, useRouter } from '@rocket.chat/ui-contexts';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { useCopyErrorReport } from './useCopyErrorReport';
import type { ErrorReportSource } from '../../lib/errorReport';

export type CopyErrorReportActionProps = Pick<ErrorReportSource, 'error' | 'componentStack'>;

const CopyErrorReportAction = ({ error, componentStack }: CopyErrorReportActionProps) => {
	const { t } = useTranslation();
	const routeName = useRouter().getRouteName();
	// Not `useServerInformation`: it throws without server info, and a fallback must not crash
	const { info } = useContext(ServerContext);
	const { copy, hasCopied } = useCopyErrorReport({
		error,
		componentStack,
		routeName,
		version: info?.version,
		commitHash: info?.commit.hash,
	});

	return (
		<StatesAction variant='primary' onClick={copy}>
			<Icon name={hasCopied ? 'check' : 'copy'} /> {hasCopied ? t('Copied') : t('Copy_error_details')}
		</StatesAction>
	);
};

export default CopyErrorReportAction;
