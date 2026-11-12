import { OUTLOOK_ADDIN_PATH } from './outlookAddInPaths';
import type { OutlookAddInManifestStrings as ManifestStrings } from './outlookAddInStrings';

const escapeXml = (value: string): string =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/**
 * The XML manifest an Exchange admin installs to put the add-in in front of their users.
 *
 * XML rather than the newer JSON manifest because on-premises Exchange only takes this one. The button asks
 * for Mailbox 1.3, the first set with add-in commands, which every supported Exchange Server's webmail has.
 */
export const buildOutlookAddInManifest = ({ id, siteUrl, strings }: { id: string; siteUrl: string; strings: ManifestStrings }): string => {
	const base = `${siteUrl.replace(/\/+$/, '')}${OUTLOOK_ADDIN_PATH}`;
	const { origin } = new URL(siteUrl);
	const s = Object.fromEntries(Object.entries(strings).map(([key, value]) => [key, escapeXml(value)])) as ManifestStrings;
	const taskpaneUrl = escapeXml(`${base}taskpane.html`);
	const icon = (size: number) => escapeXml(`${base}icon-${size}.png`);

	return `<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:bt="http://schemas.microsoft.com/office/officeappbasictypes/1.0"
	xsi:type="MailApp">
	<Id>${escapeXml(id)}</Id>
	<Version>1.0.0.0</Version>
	<ProviderName>Rocket.Chat</ProviderName>
	<DefaultLocale>en-US</DefaultLocale>
	<DisplayName DefaultValue="${s.name}"/>
	<Description DefaultValue="${s.description}"/>
	<IconUrl DefaultValue="${icon(64)}"/>
	<HighResolutionIconUrl DefaultValue="${icon(128)}"/>
	<SupportUrl DefaultValue="${escapeXml(siteUrl)}"/>
	<AppDomains>
		<AppDomain>${escapeXml(origin)}</AppDomain>
	</AppDomains>
	<Hosts>
		<Host Name="Mailbox"/>
	</Hosts>
	<Requirements>
		<Sets>
			<Set Name="Mailbox" MinVersion="1.1"/>
		</Sets>
	</Requirements>
	<FormSettings>
		<Form xsi:type="ItemEdit">
			<DesktopSettings>
				<SourceLocation DefaultValue="${taskpaneUrl}"/>
			</DesktopSettings>
		</Form>
	</FormSettings>
	<Permissions>ReadWriteItem</Permissions>
	<Rule xsi:type="RuleCollection" Mode="Or">
		<Rule xsi:type="ItemIs" ItemType="Appointment" FormType="Edit"/>
	</Rule>
	<DisableEntityHighlighting>false</DisableEntityHighlighting>
	<VersionOverrides xmlns="http://schemas.microsoft.com/office/mailappversionoverrides" xsi:type="VersionOverridesV1_0">
		<Requirements>
			<bt:Sets DefaultMinVersion="1.3">
				<bt:Set Name="Mailbox"/>
			</bt:Sets>
		</Requirements>
		<Hosts>
			<Host xsi:type="MailHost">
				<DesktopFormFactor>
					<ExtensionPoint xsi:type="AppointmentOrganizerCommandSurface">
						<OfficeTab id="TabDefault">
							<Group id="RocketChatGroup">
								<Label resid="GroupLabel"/>
								<Control xsi:type="Button" id="RocketChatAddMeeting">
									<Label resid="ButtonLabel"/>
									<Supertip>
										<Title resid="ButtonLabel"/>
										<Description resid="ButtonDescription"/>
									</Supertip>
									<Icon>
										<bt:Image size="16" resid="Icon16"/>
										<bt:Image size="32" resid="Icon32"/>
										<bt:Image size="80" resid="Icon80"/>
									</Icon>
									<Action xsi:type="ShowTaskpane">
										<SourceLocation resid="TaskpaneUrl"/>
									</Action>
								</Control>
							</Group>
						</OfficeTab>
					</ExtensionPoint>
				</DesktopFormFactor>
			</Host>
		</Hosts>
		<Resources>
			<bt:Images>
				<bt:Image id="Icon16" DefaultValue="${icon(16)}"/>
				<bt:Image id="Icon32" DefaultValue="${icon(32)}"/>
				<bt:Image id="Icon80" DefaultValue="${icon(80)}"/>
			</bt:Images>
			<bt:Urls>
				<bt:Url id="TaskpaneUrl" DefaultValue="${taskpaneUrl}"/>
			</bt:Urls>
			<bt:ShortStrings>
				<bt:String id="GroupLabel" DefaultValue="${s.group}"/>
				<bt:String id="ButtonLabel" DefaultValue="${s.button}"/>
			</bt:ShortStrings>
			<bt:LongStrings>
				<bt:String id="ButtonDescription" DefaultValue="${s.buttonDescription}"/>
			</bt:LongStrings>
		</Resources>
	</VersionOverrides>
</OfficeApp>
`;
};
