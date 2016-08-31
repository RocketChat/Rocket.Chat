this.Livechat = new (class Livechat {
	constructor() {
		this._online = new ReactiveVar(null);

		this._customColor = new ReactiveVar();
		this._onlineColor = new ReactiveVar('#C1272D');
		this._offlineColor = new ReactiveVar('#666666');

		this._customFontColor = new ReactiveVar();
		this._onlineFontColor = new ReactiveVar('#FFFFFF');
		this._offlineFontColor = new ReactiveVar('#FFFFFF');

		this._title = new ReactiveVar('Rocket.Chat');
		this._registrationForm = new ReactiveVar(true);
		this._offlineMessage = new ReactiveVar('');
		this._offlineUnavailableMessage = new ReactiveVar('');
		this._displayOfflineForm = new ReactiveVar(true);
		this._offlineSuccessMessage = new ReactiveVar(TAPi18n.__('Thanks_We_ll_get_back_to_you_soon'));
	}

	get online() {
		return this._online.get();
	}
	get color() {
		if (!this._online.get()) {
			return this._offlineColor.get();
		}
		return this._customColor.get() || this._onlineColor.get();
	}
	get fontColor() {
		if (!this._online.get()) {
			return this._offlineFontColor.get();
		}
		return this._customFontColor.get() || this._onlineFontColor.get();
	}
	get title() {
		return this._title.get();
	}
	get registrationForm() {
		return this._registrationForm.get();
	}
	get offlineMessage() {
		return this._offlineMessage.get();
	}
	get offlineUnavailableMessage() {
		return this._offlineUnavailableMessage.get();
	}
	get displayOfflineForm() {
		return this._displayOfflineForm.get();
	}
	get offlineSuccessMessage() {
		return this._offlineSuccessMessage.get();
	}

	set online(value) {
		this._online.set(value);
	}
	set title(value) {
		this._title.set(value);
	}
	set registrationForm(value) {
		this._registrationForm.set(value);
	}
	set offlineMessage(value) {
		this._offlineMessage.set(value);
	}
	set offlineUnavailableMessage(value) {
		this._offlineUnavailableMessage.set(value);
	}
	set displayOfflineForm(value) {
		this._displayOfflineForm.set(value);
	}
	set offlineSuccessMessage(value) {
		this._offlineSuccessMessage.set(value);
	}

	set customColor(value) {
		this._customColor.set(value);
	}
	set onlineColor(value) {
		this._onlineColor.set(value);
	}
	set offlineColor(value) {
		this._offlineColor.set(value);
	}

	set customFontColor(value) {
		this._customFontColor.set(value);
	}
	set onlineFontColor(value) {
		this._onlineFontColor.set(value);
	}
	set offlineFontColor(value) {
		this._offlineFontColor.set(value);
	}
})();
