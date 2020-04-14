import React, { useMemo, Fragment } from 'react';

import { useTranslation } from '../../../../client/contexts/TranslationContext';

function ImportOperationSummary({
	type,
	importerKey,
	valid,
	file,
	user,
	count,
	fileData,
	errors,
	status,
	_updatedAt,
}) {
	const t = useTranslation();

	const lastUpdated = useMemo(() => {
		if (!_updatedAt) {
			return '';
		}

		const date = new Date(_updatedAt);
		return date.toLocaleString();
	});

	const fileName = useMemo(() => {
		const fileName = file;
		if (!fileName) {
			return '';
		}

		// If the userid is inside the filename, remove it and anything before it
		const idx = fileName.indexOf(`_${ user }_`);
		if (idx >= 0) {
			return fileName.substring(idx + user.length + 2);
		}

		return fileName;
	});

	const hasCounters = useMemo(() => Boolean(count));

	const userCount = useMemo(() => {
		if (count && count.users) {
			return count.users;
		}

		return 0;
	});

	const channelCount = useMemo(() => {
		if (count && count.channels) {
			return count.channels;
		}

		return 0;
	});

	const messageCount = useMemo(() => {
		if (count && count.messages) {
			return count.messages;
		}

		return 0;
	});

	const totalCount = useMemo(() => {
		if (count && count.total) {
			return count.total;
		}

		return 0;
	});

	const hasErrors = useMemo(() => {
		if (!fileData) {
			return false;
		}

		if (fileData.users) {
			for (const user of fileData.users) {
				if (user.is_email_taken) {
					return true;
				}
				if (user.error) {
					return true;
				}
			}
		}

		if (errors && errors.length > 0) {
			return true;
		}

		return false;
	});

	const formatedError = (error) => {
		if (!error) {
			return '';
		}

		if (typeof error === 'string') {
			return error;
		}

		if (typeof error === 'object') {
			if (error.message) {
				return error.message;
			}
			if (error.error && typeof error.error === 'string') {
				return error.error;
			}

			try {
				const json = JSON.stringify(error);
				console.log(json);
				return json;
			} catch (e) {
				return t('Error');
			}
		}

		return error.toString();
	};

	const messageTime = (msg) => {
		if (!msg || !msg.ts) {
			return '';
		}

		const date = new Date(msg.ts);
		return date.toLocaleString();
	};

	return <>
		<span style={{ fontWeight: 600 }}>{t('Import_Type')}: </span>
		<span>{type} [{importerKey}]</span>
		<br/>

		<span style={{ fontWeight: 600 }}>{t('Last_Updated')}: </span>
		<span>{lastUpdated}</span>
		<br/>

		<span style={{ fontWeight: 600 }}>{valid ? t('Status') : t('Last_Status')}: </span>
		<span>{status ? t(status.replace('importer_', 'importer_status_')) : ''}</span>
		<br/>

		{file && <>
			<span style={{ fontWeight: 600 }}>{t('File')}: </span>
			<span>{fileName}</span>
			<br/>
		</>}

		{hasCounters && <>
			<span style={{ fontWeight: 600 }}>{t('Counters')}: </span>
			<br/>

			<span>{t('Users')}: </span>
			<span>{userCount}</span>
			<br/>
			<span>{t('Channels')}: </span>
			<span>{channelCount}</span>
			<br/>
			<span>{t('Messages')}: </span>
			<span>{messageCount}</span>
			<br/>
			<span>{t('Total')}: </span>
			<span>{totalCount}</span>
			<br/>

			<br/>
		</>}

		{hasErrors && <>
			<h2>{t('Errors_and_Warnings')}:</h2>
			<br/>

			{fileData.users && <>
				{fileData.users.map((user, key) => <Fragment key={key}>
					{user.is_email_taken && <>
						<span style={{ color: 'red' }}>{t('Email_already_exists')}:</span>
						<span>{user.email}</span>
						<br/>
					</>}

					{user.error && <>
						<span>{user.email}:</span>
						<span style={{ color: 'red' }}>{formatedError(user.error)}</span>
						<br/>
					</>}
				</Fragment>)}
			</>}

			{errors && <>
				<br/>
				<br/>
				<h3>{t('Not_Imported_Messages_Title')}</h3>
				<br/>
				{errors.map((error, key) => <Fragment key={key}>
					<br/>
					{error.msg && <>
						{error.msg.id && <>
							<span style={{ fontWeight: 600 }}>{t('Message_Id')}:</span>
							<span>{error.msg.id}</span>
							<br/>
						</>}
						{error.msg.userId && <>
							<span style={{ fontWeight: 600 }}>{t('Message_UserId')}:</span>
							<span>{error.msg.userId}</span>
							<br/>
						</>}
						{error.msg.ts && <>
							<span style={{ fontWeight: 600 }}>{t('Message_Time')}:</span>
							<span>{messageTime(error.msg)}</span>
							<br/>
						</>}
					</>}
					{error.error && <>
						{error.error.error && <>
							<span style={{ fontWeight: 500 }}>{t('Error')}:</span>
							<span style={{ color: 'red' }}>{error.error.error}:</span>
							<br/>
						</>}
						{error.error.message && <>
							<span style={{ fontWeight: 500 }}>{t('Message')}:</span>
							<span style={{ color: 'red' }}>{error.error.message}:</span>
							<br/>
						</>}
						{error.error.details && <>
							{error.error.details.method && <>
								<span style={{ fontWeight: 500 }}>{t('Method')}:</span>
								<span style={{ color: 'red' }}>{error.error.details.method}:</span>
								<br/>
							</>}
						</>}
					</>}
				</Fragment>)}
			</>}
			<br/>
		</>}
	</>;
}

export default ImportOperationSummary;
