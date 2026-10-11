import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

type ConferenceStatePageProps = {
	icon: IconName;
	title: string;
	subtitle?: ReactNode;
	/** What the user can do about it, if anything. A state with nothing on offer simply says what happened. */
	action?: { label: string; onClick: () => void };
};

/**
 * A conference window that can't show a call — no such call, or not this user's to see.
 *
 * The window is all the user has: there is no sidebar to go back to and no room behind it, so the page has to
 * say what happened and carry whatever way out it has. It keeps the conference's own header so the window
 * still reads as the call it was opened for.
 */
const ConferenceStatePage = ({ icon, title, subtitle, action }: ConferenceStatePageProps) => {
	const t = useTranslation();

	return (
		<Page background='tint'>
			<PageHeader title={t('Video_Conference')} />
			<PageContent display='flex' alignItems='center' justifyContent='center'>
				<States>
					<StatesIcon name={icon} variation='danger' />
					<StatesTitle>{title}</StatesTitle>
					{subtitle && <StatesSubtitle>{subtitle}</StatesSubtitle>}
					{action && (
						<StatesActions>
							<StatesAction onClick={action.onClick}>{action.label}</StatesAction>
						</StatesActions>
					)}
				</States>
			</PageContent>
		</Page>
	);
};

export default ConferenceStatePage;
