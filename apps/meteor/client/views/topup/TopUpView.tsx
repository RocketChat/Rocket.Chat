import { Meteor } from 'meteor/meteor';
import React, { ReactElement, useEffect, useState } from 'react';

import { IGateway } from '../../../definition/IGateway';

const TopUpView = (): ReactElement => {
	const [fetchedGateways, setFetchedGateways] = useState<IGateway[]>([]);
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
					});
				}
			}
		});
	};

	useEffect(() => {
		getGatewaysFn();
	}, []);

	return <div>TopUpView</div>;
};

export default TopUpView;
