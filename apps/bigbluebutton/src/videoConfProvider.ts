import { HttpStatusCode } from "@rocket.chat/apps-engine/definition/accessors";
import type { IVideoConferenceUser } from "@rocket.chat/apps-engine/definition/videoConferences";
import type { IVideoConfProvider, IVideoConferenceOptions, VideoConfData, VideoConfDataExtended } from "@rocket.chat/apps-engine/definition/videoConfProviders";
import type { BigBlueButtonApp } from "./BigBlueButtonApp";

const methodsWithoutChecksum = ['setConfigXML', '/', 'enter', 'configXML', 'signOut'];
const apiParams: Record<string, [string | RegExp, boolean][]> = {
	'/': [],
	create: [
		["meetingID", true],
		["name", true],
		["attendeePW", false],
		["moderatorPW", false],
		["welcome", false],
		["dialNumber", false],
		["voiceBridge", false],
		["webVoice", false],
		["logoutURL", false],
		["maxParticipants", false],
		["record", false],
		["duration", false],
		["moderatorOnlyMessage", false],
		["autoStartRecording", false],
		["allowStartStopRecording", false],
		[/meta_\w+/, false],
	],
	join: [
		["fullName", true],
		["meetingID", true],
		["password", true],
		["createTime", false],
		["userID", false],
		["webVoiceConf", false],
		["configToken", false],
		["avatarURL", false],
		["redirect", false],
		["clientURL", false],
	],
	isMeetingRunning: [
		["meetingID", true],
	],
	getMeetingInfo: [
		["meetingID", true],
		["password", true]
	],
	end: [
		["meetingID", true],
		["password", true],
	],
	getDefaultConfigXML: [],
	setConfigXML: [],
	enter: [],
	configXML: [],
	signOut: [],
	getRecordings: [
		["meetingID", false],
		["recordID", false],
		["state", false],
		[/meta_\w+/, false],
	],
	publishRecordings: [
		["recordID", true],
		["publish", true],
	],
	deleteRecordings: [
		["recordID", true],
	],
	updateRecordings: [
		["recordID", true],
		[/meta_\w+/, false],
	],
	'hooks/create': [
		["callbackURL", false],
		["meetingID", false],
	],
};

export class BBBProvider implements IVideoConfProvider {
	public url: string = '';

	public secret: string = '';

	public name = 'BigBlueButton';

	public shaType: 'sha256' | 'sha1' = 'sha1';

	private parser: any | undefined;

	constructor(private readonly app: BigBlueButtonApp) {
	}

	public async generateUrl(call: VideoConfData): Promise<string> {
		this.checkConfiguration();

		this.createMeeting(call);

		return this.getUrlFor('join', {
			password: 'rocket.chat.attendee',
			meetingID: call._id,
			fullName: 'Guest',
			userID: 'guest',
			joinViaHtml5: true,
			guest: true,
		});
	}

	public async customizeUrl(call: VideoConfDataExtended, user: IVideoConferenceUser, options: IVideoConferenceOptions): Promise<string> {
		if (!user) {
			return this.getUrlFor('join', {
				password: 'rocket.chat.attendee',
				meetingID: call._id,
				fullName: 'Guest',
				userID: 'guest',
				joinViaHtml5: true,
				guest: true,
			});
		}

		const isModerator = call.createdBy._id === user._id;

		return this.getUrlFor('join', {
			password: isModerator ? 'rocket.chat.moderator' : 'rocket.chat.attendee',
			meetingID: call._id,
			fullName: user.name || user.username,
			userID: user._id,
			joinViaHtml5: true,
			avatarURL: Meteor.absoluteUrl(`avatar/${user.username}`),
		});
	}

	private async createMeeting(call: VideoConfData): Promise<void> {
		const createUrl = this.getUrlFor('create', {
			name: call.type === 'direct' ? 'Direct' : call.title || 'Unnamed',
			meetingID: call._id,
			attendeePW: 'rocket.chat.attendee',
			moderatorPW: 'rocket.chat.moderator',
			welcome: '<br>Welcome to <b>%%CONFNAME%%</b>!',
			meta_html5chat: false,
			meta_html5navbar: false,
			meta_html5autoswaplayout: true,
			meta_html5autosharewebcam: false,
			meta_html5hidepresentation: true,
		});

		const { content } = await this.app.getAccessors().http.get(createUrl);
		if (!content) {
			throw new Error('Failed to create BBB video conference');
		}

		const doc = this.parseString(content);
		if (!doc?.response?.returnCode?.[0]) {
			this.app.getLogger().error("Failed to create BBB Video Conference.")
			throw new Error('Failed to create BBB video conference');
		}

		const hookApi = this.getUrlFor('hooks/create', {
			meetingID: call._id,
			// #ToDo: Get endpoint URL
			callbackURL: (`api/v1/videoconference.bbb.update/${call._id}`),
		});

		const hookResult = await this.app.getAccessors().http.get(hookApi)
		if (hookResult.statusCode !== HttpStatusCode.OK) {
			this.app.getLogger().error("Failed to create BBB Video Conference.")
			throw new Error('Failed to create BBB video conference');
		}
	}

	private getParser() {
		if (!this.parser) {
			const { Parser } = require('xml2js');
			this.parser = new Parser({
				explicitRoot: true,
			});
		}

		return this.parser;
	}

	private parseString(text: string): any {
		const parser = this.getParser();

		return parser.parseString(text);
	}

	private checkConfiguration(): void {
		if (!this.url) {
			throw new Error('BBB URL is not configured.');
		}

		if (!this.secret) {
			throw new Error('BBB Secret is not configured.');
		}
	}

	private keyMatchesAnyFilter(key: string, filters: (typeof apiParams)[string]): boolean {
		if (key.match(/^custom_/)) {
			return true;
		}

		for (const [filterName] of filters) {
			if (filterName instanceof RegExp) {
				if (key.match(filterName)) {
					return true;
				}
			} else if (key.match(`^${filterName}$`)) {
				return true;
			}
		}

		return false;
	}

	private filterParams(params: Record<string, string | boolean>, method: string): Record<string, string | boolean> {
		const filters = apiParams[method];
		if (!filters?.length) {
			return this.filterCustomParameters(params);
		}

		return this.filterCustomParameters(Object.fromEntries(Object.keys(params).filter((key) => this.keyMatchesAnyFilter(key, filters)).map((key) => [key, params[key]])));
	}

	private filterCustomParameters(params: Record<string, string | boolean>): Record<string, string | boolean> {
		return Object.fromEntries(Object.keys(params).map((key) => [key.replace(/^custom_/, ''), params[key]]));
		// return Object.keys(params).map((key) => key.match(/^custom_/) ? { [key.replace(/^custom_/, '')]: params[key] } : { [key]: params[key] }).reduce((obj, item) => ({...obj, ...item}), {});
	}

	private encodeForUrl(value: string): string {
		return encodeURIComponent(value).replace(/%20/g, '+').replace(/[!'()]/g, escape).replace(/\*/g, "%2A");
	}

	private checksum(method: string, query = ''): string {
		const { createHash } = require('crypto');

		const line = `${method}${query}${this.secret}`;
		const hash = createHash(this.shaType, 'TEXT');
		hash.update(line);

		return hash.digest('hex');
	}

	private getUrlFor(method: string, params: Record<string, string | boolean> = {}, filter = true): string {
		const filteredParams = filter ? this.filterParams(params, method) : this.filterCustomParameters(params);
		const paramList = Object.keys(filteredParams).sort().reduce((list, key) => {
			const value = String(filteredParams[key]);
			if (value) {
				list.push(`${ this.encodeForUrl(key) }=${ this.encodeForUrl(value) }`)
			}

			return list;
		}, [] as string[]);

		const query = paramList.join('&');
		const checksum = this.checksum(method, query);

		const methodName = method !== '/' ? method : '';
		const args = query ? `?${query}` : '';

		if (methodsWithoutChecksum.includes(method)) {
			return `${this.url}/${methodName}${args}`;
		}

		const separator = args ? '&' : '?';
		return `${this.url}/${methodName}${args}${separator}checksum=${checksum}`;
	}
}
