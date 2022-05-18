import { Accordion, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import React, { ReactElement, useEffect, useMemo, useState } from 'react';

import { IGateway } from '../../../definition/IGateway';
import Page from '../../components/Page';
import BankTransfer from './components/BankTransfer';
import PerfectMoneyVoucher from './components/PerfectMoneyVoucher';
import './topup.css';

const TopUpView = (): ReactElement => {
	const [fetchedGateways, setFetchedGateways] = useState<IGateway[]>([]);
	const t = useTranslation();
	const gateways = [
		{
			_id: 'perfect-money-voucher',
			show: true,
			active: true,
			sortOrder: 1,
			icon: 'voucher',
			cmpClass: 'PerfectMoneyVoucher',
		},
		{
			_id: 'bank-transfer',
			show: true,
			active: true,
			sortOrder: 2,
			icon: 'bank',
			cmpClass: 'BankTransfer',
		},
		{
			_id: 'usdt-blockchain',
			show: true,
			active: true,
			sortOrder: 3,
			icon: 'usdt',
			cmpClass: 'UsdtBlockChain',
		},
		{
			_id: 'credit-card',
			show: true,
			active: true,
			sortOrder: 4,
			icon: 'card',
			cmpClass: 'CreditCard',
		},
		{
			_id: 'paypal',
			show: true,
			active: true,
			sortOrder: 5,
			icon: 'paypal-icon',
			cmpClass: 'PaypalClass',
		},
	];

	const sortedGateways = useMemo(() => fetchedGateways.sort((a, b) => a.sortOrder - b.sortOrder), [fetchedGateways]);

	const getGatewaysFn = (): void => {
		Meteor.call('getGateways', {}, {}, (_error, result) => {
			if (result) {
				if (result.length) {
					setFetchedGateways(result);
					console.log('Gateways were fetched');
				} else {
					gateways.map((gateway, index) => {
						// The server requires us to wait atleast 2 seconds before sending in a new request.
						if (index > 0) {
							setTimeout(() => {
								Meteor.call('addGateway', gateway, (_error, result) => {
									if (result) {
										console.log('Gateway was created');
									}
								});
							}, 4000);
						}

						// Refetch the games once its done adding.
						if (index === gateways.length - 1) {
							getGatewaysFn();
						}
						return null;
					});
				}
			}
		});
	};

	useEffect(() => {
		getGatewaysFn();
	}, []);

	const capitalizeAndJoin = (word: string): string => {
		const capitalize = word.charAt(0).toUpperCase() + word.slice(1);
		return capitalize.replace(/-/g, ' ');
	};

	return (
		<Page id='topup-page'>
			<Page.Header title={t('gso_topupView_header')} />
			<Box style={{ margin: '15px 15px 0 15px' }}>
				<h3 style={{ fontSize: '19px', marginBottom: '10px' }}>{t('gso_topupView_title')}</h3>
				<p style={{ fontSize: '16px' }}>{t('gso_topupView_info')}</p>
				<Accordion style={{ margin: '15px 0' }}>
					{sortedGateways.length ? (
						<>
							<PerfectMoneyVoucher title={capitalizeAndJoin(sortedGateways[0]._id)} />
							<BankTransfer title={capitalizeAndJoin(sortedGateways[1]._id)} />
						</>
					) : (
						'Loading...'
					)}
					{sortedGateways.length
						? sortedGateways.slice(2).map((gateway, index) => (
								<Accordion.Item title={capitalizeAndJoin(gateway._id)} key={index}>
									<Box color='default' fontScale='p2'>
										{capitalizeAndJoin(gateway._id)}
									</Box>
								</Accordion.Item>
						  ))
						: 'Loading...'}
				</Accordion>
			</Box>
		</Page>
	);
};

export default TopUpView;
