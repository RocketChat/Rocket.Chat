import { Migrations } from '../../../app/migrations/server';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 220,
	up() {
		Settings.update({
			_id: 'Organization_Type',
		}, {
			$set: {
				values: [
					{
						key: 'community',
						i18nLabel: 'Community',
					},
					{
						key: 'enterprise',
						i18nLabel: 'Enterprise',
					},
					{
						key: 'government',
						i18nLabel: 'Government',
					},
					{
						key: 'nonprofit',
						i18nLabel: 'Nonprofit',
					},
				],
			},
		});

		Settings.update({
			_id: 'Industry',
		}, {
			$set: {
				values: [
					{
						key: 'aerospaceDefense',
						i18nLabel: 'Aerospace_and_Defense',
					},
					{
						key: 'blockchain',
						i18nLabel: 'Blockchain',
					},
					{
						key: 'consulting',
						i18nLabel: 'Consulting',
					},
					{
						key: 'consumerGoods',
						i18nLabel: 'Consumer_Packaged_Goods',
					},
					{
						key: 'contactCenter',
						i18nLabel: 'Contact_Center',
					},
					{
						key: 'education',
						i18nLabel: 'Education',
					},
					{
						key: 'entertainment',
						i18nLabel: 'Entertainment',
					},
					{
						key: 'financialServices',
						i18nLabel: 'Financial_Services',
					},
					{
						key: 'gaming',
						i18nLabel: 'Gaming',
					},
					{
						key: 'healthcare',
						i18nLabel: 'Healthcare',
					},
					{
						key: 'hospitalityBusinness',
						i18nLabel: 'Hospitality_Businness',
					},
					{
						key: 'insurance',
						i18nLabel: 'Insurance',
					},
					{
						key: 'itSecurity',
						i18nLabel: 'It_Security',
					},
					{
						key: 'logistics',
						i18nLabel: 'Logistics',
					},
					{
						key: 'manufacturing',
						i18nLabel: 'Manufacturing',
					},
					{
						key: 'media',
						i18nLabel: 'Media',
					},
					{
						key: 'pharmaceutical',
						i18nLabel: 'Pharmaceutical',
					},
					{
						key: 'realEstate',
						i18nLabel: 'Real_Estate',
					},
					{
						key: 'religious',
						i18nLabel: 'Religious',
					},
					{
						key: 'retail',
						i18nLabel: 'Retail',
					},
					{
						key: 'socialNetwork',
						i18nLabel: 'Social_Network',
					},
					{
						key: 'technologyProvider',
						i18nLabel: 'Technology_Provider',
					},
					{
						key: 'technologyServices',
						i18nLabel: 'Technology_Services',
					},
					{
						key: 'telecom',
						i18nLabel: 'Telecom',
					},
					{
						key: 'utilities',
						i18nLabel: 'Utilities',
					},
					{
						key: 'other',
						i18nLabel: 'Other',
					},
				],
			},
		});
	},
});
