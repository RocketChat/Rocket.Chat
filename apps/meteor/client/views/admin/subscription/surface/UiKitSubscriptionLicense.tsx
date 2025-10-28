import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitContext, bannerParser, UiKitComponent } from '@rocket.chat/fuselage-ui-kit';
import type { View } from '@rocket.chat/ui-kit';
import type { ContextType, Dispatch, ReactElement } from 'react';
import { useMemo } from 'react';

import type { SubscriptionLicenseLayout } from './UiKitSubscriptionLicenseSurface';
import { UiKitSubscriptionLicenseSurface } from './UiKitSubscriptionLicenseSurface';
import MarkdownText from '../../../../components/MarkdownText';
import { useUiKitActionManager } from '../../../../uikit/hooks/useUiKitActionManager';
import { useUiKitView } from '../../../../uikit/hooks/useUiKitView';

// TODO: move this to fuselage-ui-kit itself
bannerParser.mrkdwn = ({ text }): ReactElement => <MarkdownText variant='inline' content={text} />;

type UiKitSubscriptionLicenseProps = {
	key: string;
	initialView: {
		viewId: string;
		appId: string;
		blocks: SubscriptionLicenseLayout;
	};
};

type UseSubscriptionLicenseContextValueParams = {
	view: View & {
		viewId: string;
	};
	values: {
		[actionId: string]: {
			value: unknown;
			blockId?: string | undefined;
		};
	};
	updateValues: Dispatch<{
		actionId: string;
		payload: {
			value: unknown;
			blockId?: string | undefined;
		};
	}>;
};
type UseSubscriptionLicenseContextValueReturn = ContextType<typeof UiKitContext>;

const useSubscriptionLicenseContextValue = ({
	view,
	values,
	updateValues,
}: UseSubscriptionLicenseContextValueParams): UseSubscriptionLicenseContextValueReturn => {
	const actionManager = useUiKitActionManager();

	const emitInteraction = useMemo(() => actionManager.emitInteraction.bind(actionManager), [actionManager]);
	const debouncedEmitInteraction = useDebouncedCallback(emitInteraction, 700);

	return {
		action: async ({ appId, viewId, actionId, dispatchActionConfig, blockId, value }): Promise<void> => {
			if (!appId || !viewId) {
				return;
			}

			const emit = dispatchActionConfig?.includes('on_character_entered') ? debouncedEmitInteraction : emitInteraction;

			await emit(appId, {
				type: 'blockAction',
				actionId,
				container: {
					type: 'view',
					id: viewId,
				},
				payload: {
					blockId,
					value,
				},
			});
		},
		updateState: ({ actionId, value, blockId = 'default' }) => {
			updateValues({
				actionId,
				payload: {
					blockId,
					value,
				},
			});
		},
		...view,
		values,
		viewId: view.viewId,
	};
};

const UiKitSubscriptionLicense = ({ initialView }: UiKitSubscriptionLicenseProps) => {
	const { view, values, updateValues } = useUiKitView(initialView);
	const contextValue = useSubscriptionLicenseContextValue({ view, values, updateValues });

	return (
		<UiKitContext.Provider value={contextValue}>
			<UiKitComponent render={UiKitSubscriptionLicenseSurface} blocks={view.blocks} />
		</UiKitContext.Provider>
	);
};

export default UiKitSubscriptionLicense;
