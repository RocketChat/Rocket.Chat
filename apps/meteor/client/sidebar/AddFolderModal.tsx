import {
	Button,
	Modal,
	ModalHeader,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	TextInput,
	ButtonGroup,
	Box,
	Icon,
} from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';
import { useEndpoint, useToastMessageDispatch, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { subscriptionsQueryKeys } from '../lib/queryKeys';

type AddFolderModalProps = {
	rid: string;
	onClose: () => void;
	defaultCreateNew?: boolean;
};

const query = { open: { $ne: false } };

const AddFolderModal = ({ rid, onClose, defaultCreateNew = false }: AddFolderModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const saveDmFolder = useEndpoint('POST', '/v1/subscriptions.saveDmFolder');

	// Get all subscriptions
	const rooms = useUserSubscriptions(query) || [];

	// Extract folder counts dynamically
	const folderCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		(rooms || []).forEach((room) => {
			if (room.t === 'd' && room.dmFolder) {
				counts[room.dmFolder] = (counts[room.dmFolder] || 0) + 1;
			}
		});
		return counts;
	}, [rooms]);

	const existingFolders = useMemo(() => {
		return Object.keys(folderCounts).sort();
	}, [folderCounts]);

	const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
	const [search, setSearch] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const [isCreatingNew, setIsCreatingNew] = useState(defaultCreateNew);
	const [newFolderName, setNewFolderName] = useState('');

	const filteredFolders = useMemo(() => {
		return existingFolders.filter((folder) =>
			folder.toLowerCase().includes(search.toLowerCase())
		);
	}, [existingFolders, search]);

	const handleSaveToExisting = async () => {
		if (!selectedFolder) return;
		setIsSaving(true);
		try {
			await saveDmFolder({ roomId: rid, dmFolder: selectedFolder });
			
			// Update local cache
			queryClient.setQueryData(subscriptionsQueryKeys.subscription(rid), (sub: any) =>
				sub ? { ...sub, dmFolder: selectedFolder } : undefined
			);
			queryClient.invalidateQueries({ queryKey: ['subscriptions'] });

			dispatchToastMessage({
				type: 'success',
				message: t('Folder_saved_successfully'),
			});
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsSaving(false);
		}
	};

	const handleCreateNewFolder = async () => {
		const trimmedName = newFolderName.trim();
		if (!trimmedName) return;
		setIsSaving(true);
		try {
			await saveDmFolder({ roomId: rid, dmFolder: trimmedName });

			// Update local cache
			queryClient.setQueryData(subscriptionsQueryKeys.subscription(rid), (sub: any) =>
				sub ? { ...sub, dmFolder: trimmedName } : undefined
			);
			queryClient.invalidateQueries({ queryKey: ['subscriptions'] });

			dispatchToastMessage({
				type: 'success',
				message: t('Folder_saved_successfully'),
			});
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Modal>
			<Box
				style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
			>
				<ModalHeader>
					<ModalTitle>{t('Add_to_Folder', 'Add to Folder')}</ModalTitle>
					<ModalClose onClick={onClose} />
				</ModalHeader>
				<ModalContent>
					<Box mbe={16}>
						<TextInput
							value={search}
							onChange={(e: any) => setSearch(e.target.value)}
							placeholder={t('Search_Folders', 'Search Folders')}
							addon={<Icon name="magnifier" size="x20" />}
						/>
					</Box>

					<Box mbe={8} fontScale="h4" color="default">
						{t('All_Folders', 'All Folders')}
					</Box>

					<Box
						maxHeight="250px"
						style={{
							overflowY: 'auto',
							border: '1px solid #ddd',
							borderRadius: '6px',
							backgroundColor: '#fff',
						}}
					>
						{filteredFolders.length > 0 ? (
							filteredFolders.map((folder) => {
								const isSelected = selectedFolder === folder;
								const count = folderCounts[folder] || 0;
								const subtitle = count === 1 ? t('1_conversation', '1 conversation') : t('count_conversations', { defaultValue: `${count} conversations`, count });

								return (
									<Box
										key={folder}
										display="flex"
										alignItems="center"
										padding="10px 12px"
										style={{
											cursor: 'pointer',
											backgroundColor: isSelected ? 'rgba(31, 108, 235, 0.12)' : 'transparent',
											transition: 'background-color 0.15s ease',
										}}
										onClick={() => setSelectedFolder(folder)}
										onMouseEnter={(e: any) => {
											if (!isSelected) {
												e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
											}
										}}
										onMouseLeave={(e: any) => {
											if (!isSelected) {
												e.currentTarget.style.backgroundColor = 'transparent';
											}
										}}
									>
										{/* Styled Rounded Cover Icon on the Left */}
										<Box
											display="flex"
											alignItems="center"
											justifyContent="center"
											width="40px"
											height="40px"
											borderRadius="6px"
											bg="neutral-200"
											color="hint"
											mie="12px"
										>
											<Icon name="folder" size="x24" />
										</Box>

										{/* Folder Details */}
										<Box display="flex" flexDirection="column" style={{ flexGrow: 1 }}>
											<Box fontScale="p1" style={{ fontWeight: 600, color: isSelected ? '#1f6ceb' : 'inherit' }}>
												{folder}
											</Box>
											<Box fontScale="p2" color="hint" style={{ fontSize: '12px' }}>
												{subtitle}
											</Box>
										</Box>
									</Box>
								);
							})
						) : (
							<Box padding="24px 12px" color="hint" textAlign="center">
								{t('No_folders_found', 'No folders found')}
							</Box>
						)}
					</Box>

					{/* Inline New Folder Section */}
					{isCreatingNew ? (
						<Box
							display="flex"
							flexDirection="column"
							padding="12px"
							border="1px solid #eee"
							borderRadius="6px"
							mbs="12px"
							style={{ backgroundColor: '#fafafa' }}
						>
							<Box fontScale="p2" mbe={8} style={{ fontWeight: 600 }}>{t('New_Folder', 'New Folder')}</Box>
							<Box display="flex" alignItems="center" gap="8px" mbe={8}>
								<TextInput
									placeholder={t('Enter_folder_name', 'Enter folder name')}
									value={newFolderName}
									onChange={(e: any) => setNewFolderName(e.target.value)}
									style={{ flexGrow: 1 }}
								/>
							</Box>
							<ButtonGroup align="end">
								<Button small onClick={() => { setIsCreatingNew(false); setNewFolderName(''); }}>
									{t('Cancel')}
								</Button>
								<Button
									small
									primary
									disabled={!newFolderName.trim() || isSaving}
									onClick={handleCreateNewFolder}
								>
									{t('Create')}
								</Button>
							</ButtonGroup>
						</Box>
					) : (
						<Box display="flex" justifyContent="flex-end" mbs="12px">
							<Button
								onClick={() => setIsCreatingNew(true)}
								style={{ borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px' }}
							>
								<Icon name="plus" size="x16" />
								{t('New_Folder', 'New Folder')}
							</Button>
						</Box>
					)}
				</ModalContent>
				<ModalFooter>
					<ButtonGroup align="end">
						<Button onClick={onClose}>{t('Cancel')}</Button>
						<Button
							primary
							disabled={!selectedFolder || isSaving || isCreatingNew}
							onClick={handleSaveToExisting}
						>
							{t('Save')}
						</Button>
					</ButtonGroup>
				</ModalFooter>
			</Box>
		</Modal>
	);
};

export default AddFolderModal;
