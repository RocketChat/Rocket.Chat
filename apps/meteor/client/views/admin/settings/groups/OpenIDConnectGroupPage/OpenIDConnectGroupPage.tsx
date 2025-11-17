import React, { FC, useState, useEffect } from 'react';
import { Box, Field, TextInput, FieldGroup, Button, ToggleSwitch } from '@rocket.chat/fuselage';
import { useSetting, useSettings, useToastMessageDispatch } from '@rocket.chat/ui-contexts';

const OpenIDConnectGroupPage: FC = () => {
	const dispatchToastMessage = useToastMessageDispatch();

	const oidcEnabled = useSetting('OIDC_Enable');
	const oidcIssuer = useSetting('OIDC_Issuer');
	const oidcClientID = useSetting('OIDC_Client_ID');
	const oidcClientSecret = useSetting('OIDC_Client_Secret');

	const [enabled, setEnabled] = useState(false);
	const [issuer, setIssuer] = useState('');
	const [clientID, setClientID] = useState('');
	const [clientSecret, setClientSecret] = useState('');

	useEffect(() => {
		setEnabled(oidcEnabled as boolean);
		setIssuer(oidcIssuer as string);
		setClientID(oidcClientID as string);
		setClientSecret(oidcClientSecret as string);
	}, [oidcEnabled, oidcIssuer, oidcClientID, oidcClientSecret]);

	const settings = useSettings();

	const handleSave = async () => {
		try {
			await settings.batchSet([
				{ _id: 'OIDC_Enable', value: enabled },
				{ _id: 'OIDC_Issuer', value: issuer },
				{ _id: 'OIDC_Client_ID', value: clientID },
				{ _id: 'OIDC_Client_Secret', value: clientSecret },
			]);
			dispatchToastMessage({ type: 'success', message: 'Settings saved' });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<Box>
			<FieldGroup>
				<Field>
					<Field.Label>Enable</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>Issuer URL</Field.Label>
					<Field.Row>
						<TextInput value={issuer} onChange={(e) => setIssuer(e.target.value)} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>Client ID</Field.Label>
					<Field.Row>
						<TextInput value={clientID} onChange={(e) => setClientID(e.target.value)} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>Client Secret</Field.Label>
					<Field.Row>
						<TextInput value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} />
					</Field.Row>
				</Field>
			</FieldGroup>
			<Button primary onClick={handleSave}>Save changes</Button>
		</Box>
	);
};

export default OpenIDConnectGroupPage;
