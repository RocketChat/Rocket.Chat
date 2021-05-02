import React from 'react';
import { Box, Tag, Modal, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import Emoji from '../../../../client/components/Emoji';
import { openUserCard } from '../../../ui/client/lib/UserCard';


export default function ReactionListContent({ rid, reactions, tabBar, onClose }) {
	const t = useTranslation();
	const onClick = useMutableCallback((e) => {
		const { username } = e.currentTarget.dataset;
		if (!username) {
			return;
		}
		openUserCard({
			username,
			rid,
			target: e.currentTarget,
			open: (e) => {
				e.preventDefault();
				onClose();
				tabBar.openUserInfo(username);
			},
		});
	});

	return <>
		<Modal.Header>
			<Modal.Title>{t('Read_by')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			<Reactions reactions={reactions} onClick={onClick} onClose={onClose}/>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</>;
}
<template name="readReceipts">

		<p>{{_ "Read_by"}}:</p>
		<ul class="read-receipts">
			{{#each receipts}}
				<li class="read-receipts__user background-transparent-dark-hover">
					{{> avatar username=user.username}}
					<div class="read-receipts__name color-primary-font-color">{{displayName}}</div>
					<span class="read-receipts__time color-info-font-color" title="{{dateTime}}">{{time}}</span>
				</li>
			{{/each}}
		</ul>
	{{/if}}
</template>