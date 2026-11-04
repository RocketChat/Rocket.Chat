import { uiKitModal } from '@rocket.chat/ui-kit';
import type { ComponentChild } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import { useTranslation } from 'react-i18next';

import { ErrorsContext } from './InputField';
import { modalParser } from './ModalParser';
import { createModalState, isInputElementBlock, recordInput } from './state';
import type { ModalViewState } from './state';
import { Button } from '../../Button';
import { ButtonGroup } from '../../ButtonGroup';
import { Modal } from '../../Modal';
import Surface from '../message/Surface';

type ViewBlock = { type: string; blockId?: string; [key: string]: any };

export type UiKitModalView = {
	id: string;
	title: { text: string };
	submit?: { text: { text: string } };
	close?: { text: { text: string } };
	blocks: ViewBlock[];
	state?: ModalViewState;
};

const renderBlocks = uiKitModal(modalParser, { engine: 'livechat' }) as (blocks: any) => ComponentChild[];

export type UiKitModalProps = {
	appId: string;
	view: UiKitModalView;
	errors?: Record<string, string>;
	dispatchBlockAction: (args: { appId: string; actionId: string; payload: unknown }) => Promise<unknown>;
	onSubmit: (state: ModalViewState) => Promise<void> | void;
	onClose: (state: ModalViewState) => Promise<void> | void;
};

export const UiKitModal = ({ appId, view, errors = {}, dispatchBlockAction, onSubmit, onClose }: UiKitModalProps) => {
	const { t } = useTranslation();
	const [userState, setUserState] = useState<ModalViewState>({});
	const [busy, setBusy] = useState(false);

	const state = createModalState(view.blocks, userState);

	const dispatchAction = useCallback(
		({ blockId, actionId, payload }: { blockId?: string; actionId: string; payload: any }) => {
			if (blockId && isInputElementBlock(view.blocks, blockId, actionId)) {
				setUserState((current) => recordInput(current, blockId, actionId, payload));
				return;
			}

			return dispatchBlockAction({ appId, actionId, payload: { ...payload, blockId } });
		},
		[appId, dispatchBlockAction, view.blocks],
	);

	const run = useCallback(
		async (action: (state: ModalViewState) => Promise<void> | void) => {
			setBusy(true);
			try {
				await action(state);
			} finally {
				setBusy(false);
			}
		},
		[state],
	);

	return (
		<Modal open animated dismissByOverlay={false} onDismiss={() => run(onClose)}>
			<h3>{view.title.text}</h3>
			<ErrorsContext.Provider value={errors}>
				<Surface dispatchAction={dispatchAction}>{renderBlocks(view.blocks)}</Surface>
			</ErrorsContext.Provider>
			<ButtonGroup>
				<Button outline secondary disabled={busy} onClick={() => run(onClose)}>
					{view.close?.text.text ?? t('cancel')}
				</Button>
				<Button disabled={busy} onClick={() => run(onSubmit)}>
					{view.submit?.text.text ?? t('send')}
				</Button>
			</ButtonGroup>
		</Modal>
	);
};
