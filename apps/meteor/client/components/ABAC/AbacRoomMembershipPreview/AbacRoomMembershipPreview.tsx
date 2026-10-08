import type { AbacMembershipGroup } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Button, ButtonGroup, Icon, Select, TextInput } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import {
	ContextualbarContent,
	ContextualbarEmptyContent,
	ContextualbarFooter,
	ContextualbarSection,
	VirtualizedScrollbars,
} from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import AbacRoomPreviewGroupHeader from './AbacRoomPreviewGroupHeader';
import type { AbacRoomPreviewListContext } from './AbacRoomPreviewList';
import AbacRoomPreviewList from './AbacRoomPreviewList';
import AbacRoomPreviewListFooter from './AbacRoomPreviewListFooter';
import AbacRoomPreviewMemberRow from './AbacRoomPreviewMemberRow';
import AbacRoomPreviewProgress from './AbacRoomPreviewProgress';
import { useEditorFirst } from './useEditorFirst';
import { useRoomMembershipPreview } from './useRoomMembershipPreview';
import { useRoomMembershipPreviewEditor } from './useRoomMembershipPreviewEditor';
import { ABACQueryKeys } from '../../../lib/queryKeys';
import WarningModal from '../../WarningModal';
import AbacErrorCallout from '../AbacErrorCallout';

const groupLabels: Record<AbacMembershipGroup, TranslationKey> = {
	loses: 'ABAC_Preview_Loses_access',
	retains: 'ABAC_Preview_Retains_access',
};

const emptyLabels: Record<AbacMembershipGroup, TranslationKey> = {
	loses: 'ABAC_Preview_No_members_lose_access',
	retains: 'ABAC_Preview_No_members_retain_access',
};

const isMembershipGroup = (value: unknown): value is AbacMembershipGroup => value === 'loses' || value === 'retains';

type AbacRoomMembershipPreviewProps = {
	rid: string;
	roomName: string;
	attributes: Record<string, string[]>;
	onBack: () => void;
	onSave: (editorLosesAccess: boolean) => Promise<unknown>;
};

const AbacRoomMembershipPreview = ({ rid, roomName, attributes, onBack, onSave }: AbacRoomMembershipPreviewProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const queryClient = useQueryClient();

	const [text, setText] = useState('');
	const [group, setGroup] = useState<AbacMembershipGroup>('loses');
	const filter = useDebouncedValue(text.trim(), 400);

	const editor = useRoomMembershipPreviewEditor(rid, attributes);

	useEffect(() => () => queryClient.removeQueries({ queryKey: ABACQueryKeys.roomMembershipPreview.all(rid) }), [queryClient, rid]);

	const saveMutation = useMutation({ mutationFn: () => onSave(editor?.losesAccess ?? false) });
	const isSaving = saveMutation.isPending || saveMutation.isSuccess;
	const preview = useRoomMembershipPreview(rid, attributes, filter, group, isSaving);

	const handleSave = () => {
		if (editor?.losesAccess) {
			setModal(
				<WarningModal
					text={t('ABAC_Preview_Self_lockout_warning', { roomName })}
					confirmText={t('Save')}
					cancelText={t('Cancel')}
					close={() => setModal(null)}
					confirm={() => {
						setModal(null);
						saveMutation.mutate();
					}}
				/>,
			);
			return;
		}

		saveMutation.mutate();
	};

	const options = useMemo<SelectOption[]>(
		() => [
			['loses', t(groupLabels.loses)],
			['retains', t(groupLabels.retains)],
		],
		[t],
	);

	const { checked, total, isPending, isError, error, isChecking, isPartial, isExhausted } = preview;
	const members = useEditorFirst(rid, preview.members, editor, group, filter);
	const footerContext = { isPartial, canLoadMore: !isSaving, onLoadMore: preview.loadMore };

	return (
		<>
			<ContextualbarSection>
				<Box flexGrow={1} flexBasis={0} minWidth={0}>
					<TextInput
						placeholder={t('ABAC_Preview_Search_members')}
						aria-label={t('ABAC_Preview_Search_members')}
						value={text}
						onChange={(event: ChangeEvent<HTMLInputElement>) => setText(event.currentTarget.value)}
						endAddon={<Icon name='magnifier' size='x20' />}
					/>
				</Box>
				<Box display='flex' flexGrow={1} flexBasis={0} minWidth={0} marginInlineStart={8}>
					<Select
						aria-label={t('ABAC_Preview_Access_filter')}
						options={options}
						value={group}
						onChange={(value) => {
							if (isMembershipGroup(value)) {
								setGroup(value);
							}
						}}
					/>
				</Box>
			</ContextualbarSection>
			<ContextualbarContent paddingInline={0}>
				{isError && (
					<Box paddingInline={24} paddingBlock={12}>
						<AbacErrorCallout error={error} fallback='ABAC_Preview_Unavailable' />
					</Box>
				)}
				{!isError && (
					<>
						<AbacRoomPreviewProgress
							roomName={roomName}
							group={group}
							isSearching={filter !== ''}
							found={members.length}
							checked={checked}
							total={total}
							isChecking={isChecking}
							isPartial={isPartial}
							isExhausted={isExhausted}
							onStop={preview.stop}
						/>
						<AbacRoomPreviewGroupHeader title={t(groupLabels[group])} />
						{members.length === 0 && <AbacRoomPreviewListFooter context={{ ...footerContext, loading: isPending || isChecking }} />}
						{isExhausted && members.length === 0 && (
							<ContextualbarEmptyContent title={filter ? t('No_members_found') : t(emptyLabels[group])} />
						)}
						{members.length > 0 && (
							<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
								<VirtualizedScrollbars>
									<Virtuoso<(typeof members)[number], AbacRoomPreviewListContext>
										style={{ height: '100%', width: '100%' }}
										data={members}
										endReached={preview.onEndReached}
										components={{ List: AbacRoomPreviewList, Footer: AbacRoomPreviewListFooter }}
										context={{ ...footerContext, label: t(groupLabels[group]), loading: isChecking }}
										itemContent={(_index, member) => <AbacRoomPreviewMemberRow member={member} />}
									/>
								</VirtualizedScrollbars>
							</Box>
						)}
					</>
				)}
			</ContextualbarContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onBack} disabled={saveMutation.isPending}>
						{t('Back')}
					</Button>
					<Button primary onClick={handleSave} disabled={!editor} loading={saveMutation.isPending}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AbacRoomMembershipPreview;
