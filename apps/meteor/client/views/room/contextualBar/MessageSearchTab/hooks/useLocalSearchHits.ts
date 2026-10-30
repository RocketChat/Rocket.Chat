import type { E2EESearchHit } from '@rocket.chat/desktop-api';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';

import type { LocalSearchHit } from '../../../../../lib/e2eeSearch/ui/LocalMessageSearchHit';
import { setMessageJumpQueryStringParameter } from '../../../../../lib/utils/setMessageJumpQueryStringParameter';
import { Messages } from '../../../../../stores';
import { useGoToThread } from '../../../hooks/useGoToThread';

const noHits: E2EESearchHit[] = [];

export const useLocalSearchHits = (hits: E2EESearchHit[] = noHits) => {
	const useRealName = useSetting('UI_Use_Real_Name', false);
	const messages = Messages.use((state) => state.records);
	const goToThread = useGoToThread();
	const displayHits: LocalSearchHit[] = useMemo(
		() =>
			hits.map((hit) => {
				const loadedAuthor = messages.get(hit.id)?.u;
				const username = loadedAuthor?.username || hit.username;
				return { ...hit, username, displayName: (useRealName && loadedAuthor?.username && loadedAuthor.name) || username };
			}),
		[hits, messages, useRealName],
	);
	const onOpenHit = useCallback(
		(hit: LocalSearchHit) => {
			if (hit.tmid) {
				goToThread({ rid: hit.rid, tmid: hit.tmid, msg: hit.id });
				return;
			}
			void setMessageJumpQueryStringParameter(hit.id);
		},
		[goToThread],
	);
	return { hits: displayHits, onOpenHit };
};
