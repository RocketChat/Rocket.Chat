import type { Locator, Page } from '@playwright/test';

import {
	HomeContent,
	Navbar,
	Sidepanel,
	RoomSidebar,
	ToastMessages,
	RoomComposer,
	ThreadComposer,
	MembersFlexTab,
	ChannelsFlexTab,
	NotificationPreferencesFlexTab,
	ExportMessagesFlexTab,
	PruneMessagesFlexTab,
	SearchMessagesFlexTab,
	RoomInfoFlexTab,
	ThreadsFlexTab,
	EditRoomFlexTab,
	UserInfoFlexTab,
	FilesFlexTab,
} from './fragments';
import { RoomToolbar } from './fragments/toolbar';
import { UserCard } from './fragments/user-card';
import { VoiceCalls } from './fragments/voice-calls';

export class HomeChannel {
	public readonly page: Page;

	readonly content: HomeContent;

	readonly sidebar: RoomSidebar;

	readonly sidepanel: Sidepanel;

	readonly navbar: Navbar;

	readonly userCard: UserCard;

	private _tabs: {
		members: MembersFlexTab;
		userInfo: UserInfoFlexTab;
		room: RoomInfoFlexTab;
		editRoom: EditRoomFlexTab;
		channels: ChannelsFlexTab;
		notificationPreferences: NotificationPreferencesFlexTab;
		exportMessages: ExportMessagesFlexTab;
		pruneMessages: PruneMessagesFlexTab;
		searchMessages: SearchMessagesFlexTab;
		threads: ThreadsFlexTab;
		files: FilesFlexTab;
	};

	readonly roomToolbar: RoomToolbar;

	readonly voiceCalls: VoiceCalls;

	readonly toastMessage: ToastMessages;

	readonly composer: RoomComposer;

	readonly threadComposer: ThreadComposer;

	constructor(page: Page) {
		this.page = page;
		this.content = new HomeContent(page);
		this.sidebar = new RoomSidebar(page);
		this.sidepanel = new Sidepanel(page);
		this.navbar = new Navbar(page);
		this.userCard = new UserCard(page);
		this._tabs = {
			members: new MembersFlexTab(page),
			userInfo: new UserInfoFlexTab(page),
			room: new RoomInfoFlexTab(page.getByRole('dialog', { name: 'Channel info' }), page),
			editRoom: new EditRoomFlexTab(page.getByRole('dialog', { name: 'Edit channel' })),
			channels: new ChannelsFlexTab(page),
			notificationPreferences: new NotificationPreferencesFlexTab(page),
			exportMessages: new ExportMessagesFlexTab(page),
			pruneMessages: new PruneMessagesFlexTab(page),
			searchMessages: new SearchMessagesFlexTab(page),
			threads: new ThreadsFlexTab(page),
			files: new FilesFlexTab(page),
		};
		this.roomToolbar = new RoomToolbar(page);
		this.voiceCalls = new VoiceCalls(page);
		this.toastMessage = new ToastMessages(page);
		this.composer = new RoomComposer(page);
		this.threadComposer = new ThreadComposer(page);
	}

	get tabs() {
		return this._tabs;
	}

	goto() {
		return this.page.goto('/home');
	}

	get btnContextualbarClose(): Locator {
		return this.page.locator('[data-qa="ContextualbarActionClose"]');
	}

	get userCardToolbar(): Locator {
		return this.page.locator('[role=toolbar][aria-label="User card actions"]');
	}

	get roomHeaderFavoriteBtn(): Locator {
		return this.page.getByRole('main').getByRole('button', { name: 'Favorite' });
	}

	get roomHeaderToolbar(): Locator {
		return this.page.locator('[role=toolbar][aria-label="Primary Room actions"]');
	}

	get markUnread(): Locator {
		return this.page.locator('role=menuitem[name="Mark Unread"]');
	}

	get dialogEnterE2EEPassword(): Locator {
		return this.page.getByRole('dialog', { name: 'Enter E2EE password' });
	}

	get dialogSaveE2EEPassword(): Locator {
		return this.page.getByRole('dialog', { name: 'Save your new E2EE password' });
	}

	get btnRoomSaveE2EEPassword(): Locator {
		return this.page.getByRole('main').getByRole('button', { name: 'Save E2EE password' });
	}

	get btnRoomEnterE2EEPassword(): Locator {
		return this.page.getByRole('main').getByRole('button', { name: 'Enter your E2E password' });
	}

	get btnSavedMyPassword(): Locator {
		return this.dialogSaveE2EEPassword.getByRole('button', { name: 'I saved my password' });
	}

	get bannerSaveEncryptionPassword(): Locator {
		return this.page.getByRole('button', { name: 'Save your new E2EE password' });
	}

	get bannerEnterE2EEPassword(): Locator {
		return this.page.getByRole('button', { name: 'Enter your E2E password' });
	}

	get audioRecorder(): Locator {
		return this.page.getByRole('group', { name: 'Audio recorder', exact: true });
	}

	get statusUploadError(): Locator {
		return this.page.getByRole('main').getByRole('status').getByText('Error');
	}

	get homepageHeader(): Locator {
		return this.page.locator('main').getByRole('heading', { name: 'Home' });
	}

	get dialogEmojiPicker(): Locator {
		return this.page.getByRole('dialog', { name: 'Emoji picker' });
	}

	get scrollerEmojiPicker(): Locator {
		return this.dialogEmojiPicker.locator('[data-overlayscrollbars]');
	}

	get btnJoinChannel() {
		return this.page.getByRole('button', { name: 'Join channel' });
	}

	getEmojiPickerTabByName(name: string) {
		return this.dialogEmojiPicker.locator(`role=tablist >> role=tab[name="${name}"]`);
	}

	getEmojiByName(name: string) {
		return this.dialogEmojiPicker.locator(`role=tabpanel >> role=button[name="${name}"]`);
	}

	async pickEmoji(emoji: string, section = 'Smileys & People') {
		await this.composer.btnEmoji.click();
		await this.getEmojiPickerTabByName(section).click();
		await this.getEmojiByName(emoji).click();
	}

	async waitForHome(): Promise<void> {
		await this.homepageHeader.waitFor({ state: 'visible' });
	}

	async waitForRoomLoad(): Promise<void> {
		await this.roomHeaderToolbar.waitFor({ state: 'visible' });
	}
}
