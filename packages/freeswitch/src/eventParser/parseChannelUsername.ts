/**
 * Gets the FreeSwitch username associated with the channel that an event was triggered for
 *
 * By design of our integration, FreeSwitch usernames are always equal to the User's Extension Number.
 * So effectively this returns an extension number.
 */

export function parseChannelUsername(channelName?: string): string | undefined {
	// If it's not a sofia internal channel, don't even try to parse it
	// It's most likely a voicemail or maybe some spam bots trying different stuff
	// If we implement other kinds of channels in the future we should look into how their names are generated so that we may parse them here too.
	if (!channelName?.startsWith('sofia/internal/') || !channelName.includes('@')) {
		console.log(channelName, 'not a sofia internal channel');
		return;
	}

	// Originator channels will have the format 'sofia/internal/username@freeswitch_host', assigned by freeswitch itself
	// Example: sofia/internal/1001@voip.open.rocket.chat:9999

	// Originatee channels will have the format 'sofia/internal/contact_uri', assigned by freeswitch itself
	// Contact URI format is 'username-rocketchat_userid-random_key@rocketchat_hostname', assigned by the rocket.chat client on the REGISTER request
	// Example: sofia/internal/1000-LJZ8A9MhHv4Eh6ZQH-spo254ol@open.rocket.chat

	return channelName.match(/sofia\/internal\/(\d+)[\@\-]/)?.[1];
}

export function parseEventUsername(eventData: Record<string, string | undefined>): string | undefined {
	const { 'Channel-Name': channelName } = eventData;

	return parseChannelUsername(channelName);
}
