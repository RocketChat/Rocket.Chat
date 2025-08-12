import { settingsRegistry } from '../../app/settings/server';

export const createSetupWSettings = () =>
	settingsRegistry.addGroup('Setup_Wizard', async function () {
		await this.section('Organization_Info', async function () {
			await this.add('Organization_Type', '', {
				type: 'select',
				values: [
					{
						key: 'community',
						i18nLabel: 'Community',
					},
					{
						key: 'enterprise',
						i18nLabel: 'Premium',
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
				wizard: {
					step: 2,
					order: 0,
				},
			});
			await this.add('Organization_Name', '', {
				type: 'string',
				wizard: {
					step: 2,
					order: 1,
				},
				public: true,
			});
			await this.add('Industry', '', {
				type: 'select',
				values: [
					{
						key: 'aerospaceDefense',
						i18nLabel: 'Aerospace_and_Defense',
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
				wizard: {
					step: 2,
					order: 2,
				},
			});
			await this.add('Size', '', {
				type: 'select',
				values: [
					{
						key: '0',
						i18nLabel: '1-10 people',
					},
					{
						key: '1',
						i18nLabel: '11-50 people',
					},
					{
						key: '2',
						i18nLabel: '51-100 people',
					},
					{
						key: '3',
						i18nLabel: '101-250 people',
					},
					{
						key: '4',
						i18nLabel: '251-500 people',
					},
					{
						key: '5',
						i18nLabel: '501-1000 people',
					},
					{
						key: '6',
						i18nLabel: '1001-4000 people',
					},
					{
						key: '7',
						i18nLabel: '4000 or more people',
					},
				],
				wizard: {
					step: 2,
					order: 3,
				},
			});
			await this.add('Country', '', {
				type: 'select',
				values: [
					{
						key: 'afghanistan',
						i18nLabel: 'Country_Afghanistan',
					},
					{
						key: 'albania',
						i18nLabel: 'Country_Albania',
					},
					{
						key: 'algeria',
						i18nLabel: 'Country_Algeria',
					},
					{
						key: 'americanSamoa',
						i18nLabel: 'Country_American_Samoa',
					},
					{
						key: 'andorra',
						i18nLabel: 'Country_Andorra',
					},
					{
						key: 'angola',
						i18nLabel: 'Country_Angola',
					},
					{
						key: 'anguilla',
						i18nLabel: 'Country_Anguilla',
					},
					{
						key: 'antarctica',
						i18nLabel: 'Country_Antarctica',
					},
					{
						key: 'antiguaAndBarbuda',
						i18nLabel: 'Country_Antigua_and_Barbuda',
					},
					{
						key: 'argentina',
						i18nLabel: 'Country_Argentina',
					},
					{
						key: 'armenia',
						i18nLabel: 'Country_Armenia',
					},
					{
						key: 'aruba',
						i18nLabel: 'Country_Aruba',
					},
					{
						key: 'australia',
						i18nLabel: 'Country_Australia',
					},
					{
						key: 'austria',
						i18nLabel: 'Country_Austria',
					},
					{
						key: 'azerbaijan',
						i18nLabel: 'Country_Azerbaijan',
					},
					{
						key: 'bahamas',
						i18nLabel: 'Country_Bahamas',
					},
					{
						key: 'bahrain',
						i18nLabel: 'Country_Bahrain',
					},
					{
						key: 'bangladesh',
						i18nLabel: 'Country_Bangladesh',
					},
					{
						key: 'barbados',
						i18nLabel: 'Country_Barbados',
					},
					{
						key: 'belarus',
						i18nLabel: 'Country_Belarus',
					},
					{
						key: 'belgium',
						i18nLabel: 'Country_Belgium',
					},
					{
						key: 'belize',
						i18nLabel: 'Country_Belize',
					},
					{
						key: 'benin',
						i18nLabel: 'Country_Benin',
					},
					{
						key: 'bermuda',
						i18nLabel: 'Country_Bermuda',
					},
					{
						key: 'bhutan',
						i18nLabel: 'Country_Bhutan',
					},
					{
						key: 'bolivia',
						i18nLabel: 'Country_Bolivia',
					},
					{
						key: 'bosniaAndHerzegovina',
						i18nLabel: 'Country_Bosnia_and_Herzegovina',
					},
					{
						key: 'botswana',
						i18nLabel: 'Country_Botswana',
					},
					{
						key: 'bouvetIsland',
						i18nLabel: 'Country_Bouvet_Island',
					},
					{
						key: 'brazil',
						i18nLabel: 'Country_Brazil',
					},
					{
						key: 'britishIndianOceanTerritory',
						i18nLabel: 'Country_British_Indian_Ocean_Territory',
					},
					{
						key: 'bruneiDarussalam',
						i18nLabel: 'Country_Brunei_Darussalam',
					},
					{
						key: 'bulgaria',
						i18nLabel: 'Country_Bulgaria',
					},
					{
						key: 'burkinaFaso',
						i18nLabel: 'Country_Burkina_Faso',
					},
					{
						key: 'burundi',
						i18nLabel: 'Country_Burundi',
					},
					{
						key: 'cambodia',
						i18nLabel: 'Country_Cambodia',
					},
					{
						key: 'cameroon',
						i18nLabel: 'Country_Cameroon',
					},
					{
						key: 'canada',
						i18nLabel: 'Country_Canada',
					},
					{
						key: 'capeVerde',
						i18nLabel: 'Country_Cape_Verde',
					},
					{
						key: 'caymanIslands',
						i18nLabel: 'Country_Cayman_Islands',
					},
					{
						key: 'centralAfricanRepublic',
						i18nLabel: 'Country_Central_African_Republic',
					},
					{
						key: 'chad',
						i18nLabel: 'Country_Chad',
					},
					{
						key: 'chile',
						i18nLabel: 'Country_Chile',
					},
					{
						key: 'china',
						i18nLabel: 'Country_China',
					},
					{
						key: 'christmasIsland',
						i18nLabel: 'Country_Christmas_Island',
					},
					{
						key: 'cocosKeelingIslands',
						i18nLabel: 'Country_Cocos_Keeling_Islands',
					},
					{
						key: 'colombia',
						i18nLabel: 'Country_Colombia',
					},
					{
						key: 'comoros',
						i18nLabel: 'Country_Comoros',
					},
					{
						key: 'congo',
						i18nLabel: 'Country_Congo',
					},
					{
						key: 'congoTheDemocraticRepublicOfThe',
						i18nLabel: 'Country_Congo_The_Democratic_Republic_of_The',
					},
					{
						key: 'cookIslands',
						i18nLabel: 'Country_Cook_Islands',
					},
					{
						key: 'costaRica',
						i18nLabel: 'Country_Costa_Rica',
					},
					{
						key: 'coteDivoire',
						i18nLabel: 'Country_Cote_Divoire',
					},
					{
						key: 'croatia',
						i18nLabel: 'Country_Croatia',
					},
					{
						key: 'cuba',
						i18nLabel: 'Country_Cuba',
					},
					{
						key: 'cyprus',
						i18nLabel: 'Country_Cyprus',
					},
					{
						key: 'czechRepublic',
						i18nLabel: 'Country_Czech_Republic',
					},
					{
						key: 'denmark',
						i18nLabel: 'Country_Denmark',
					},
					{
						key: 'djibouti',
						i18nLabel: 'Country_Djibouti',
					},
					{
						key: 'dominica',
						i18nLabel: 'Country_Dominica',
					},
					{
						key: 'dominicanRepublic',
						i18nLabel: 'Country_Dominican_Republic',
					},
					{
						key: 'ecuador',
						i18nLabel: 'Country_Ecuador',
					},
					{
						key: 'egypt',
						i18nLabel: 'Country_Egypt',
					},
					{
						key: 'elSalvador',
						i18nLabel: 'Country_El_Salvador',
					},
					{
						key: 'equatorialGuinea',
						i18nLabel: 'Country_Equatorial_Guinea',
					},
					{
						key: 'eritrea',
						i18nLabel: 'Country_Eritrea',
					},
					{
						key: 'estonia',
						i18nLabel: 'Country_Estonia',
					},
					{
						key: 'ethiopia',
						i18nLabel: 'Country_Ethiopia',
					},
					{
						key: 'falklandIslandsMalvinas',
						i18nLabel: 'Country_Falkland_Islands_Malvinas',
					},
					{
						key: 'faroeIslands',
						i18nLabel: 'Country_Faroe_Islands',
					},
					{
						key: 'fiji',
						i18nLabel: 'Country_Fiji',
					},
					{
						key: 'finland',
						i18nLabel: 'Country_Finland',
					},
					{
						key: 'france',
						i18nLabel: 'Country_France',
					},
					{
						key: 'frenchGuiana',
						i18nLabel: 'Country_French_Guiana',
					},
					{
						key: 'frenchPolynesia',
						i18nLabel: 'Country_French_Polynesia',
					},
					{
						key: 'frenchSouthernTerritories',
						i18nLabel: 'Country_French_Southern_Territories',
					},
					{
						key: 'gabon',
						i18nLabel: 'Country_Gabon',
					},
					{
						key: 'gambia',
						i18nLabel: 'Country_Gambia',
					},
					{
						key: 'georgia',
						i18nLabel: 'Country_Georgia',
					},
					{
						key: 'germany',
						i18nLabel: 'Country_Germany',
					},
					{
						key: 'ghana',
						i18nLabel: 'Country_Ghana',
					},
					{
						key: 'gibraltar',
						i18nLabel: 'Country_Gibraltar',
					},
					{
						key: 'greece',
						i18nLabel: 'Country_Greece',
					},
					{
						key: 'greenland',
						i18nLabel: 'Country_Greenland',
					},
					{
						key: 'grenada',
						i18nLabel: 'Country_Grenada',
					},
					{
						key: 'guadeloupe',
						i18nLabel: 'Country_Guadeloupe',
					},
					{
						key: 'guam',
						i18nLabel: 'Country_Guam',
					},
					{
						key: 'guatemala',
						i18nLabel: 'Country_Guatemala',
					},
					{
						key: 'guinea',
						i18nLabel: 'Country_Guinea',
					},
					{
						key: 'guineaBissau',
						i18nLabel: 'Country_Guinea_bissau',
					},
					{
						key: 'guyana',
						i18nLabel: 'Country_Guyana',
					},
					{
						key: 'haiti',
						i18nLabel: 'Country_Haiti',
					},
					{
						key: 'heardIslandAndMcdonaldIslands',
						i18nLabel: 'Country_Heard_Island_and_Mcdonald_Islands',
					},
					{
						key: 'holySeeVaticanCityState',
						i18nLabel: 'Country_Holy_See_Vatican_City_State',
					},
					{
						key: 'honduras',
						i18nLabel: 'Country_Honduras',
					},
					{
						key: 'hongKong',
						i18nLabel: 'Country_Hong_Kong',
					},
					{
						key: 'hungary',
						i18nLabel: 'Country_Hungary',
					},
					{
						key: 'iceland',
						i18nLabel: 'Country_Iceland',
					},
					{
						key: 'india',
						i18nLabel: 'Country_India',
					},
					{
						key: 'indonesia',
						i18nLabel: 'Country_Indonesia',
					},
					{
						key: 'iranIslamicRepublicOf',
						i18nLabel: 'Country_Iran_Islamic_Republic_of',
					},
					{
						key: 'iraq',
						i18nLabel: 'Country_Iraq',
					},
					{
						key: 'ireland',
						i18nLabel: 'Country_Ireland',
					},
					{
						key: 'israel',
						i18nLabel: 'Country_Israel',
					},
					{
						key: 'italy',
						i18nLabel: 'Country_Italy',
					},
					{
						key: 'jamaica',
						i18nLabel: 'Country_Jamaica',
					},
					{
						key: 'japan',
						i18nLabel: 'Country_Japan',
					},
					{
						key: 'jordan',
						i18nLabel: 'Country_Jordan',
					},
					{
						key: 'kazakhstan',
						i18nLabel: 'Country_Kazakhstan',
					},
					{
						key: 'kenya',
						i18nLabel: 'Country_Kenya',
					},
					{
						key: 'kiribati',
						i18nLabel: 'Country_Kiribati',
					},
					{
						key: 'koreaDemocraticPeoplesRepublicOf',
						i18nLabel: 'Country_Korea_Democratic_Peoples_Republic_of',
					},
					{
						key: 'koreaRepublicOf',
						i18nLabel: 'Country_Korea_Republic_of',
					},
					{
						key: 'kuwait',
						i18nLabel: 'Country_Kuwait',
					},
					{
						key: 'kyrgyzstan',
						i18nLabel: 'Country_Kyrgyzstan',
					},
					{
						key: 'laoPeoplesDemocraticRepublic',
						i18nLabel: 'Country_Lao_Peoples_Democratic_Republic',
					},
					{
						key: 'latvia',
						i18nLabel: 'Country_Latvia',
					},
					{
						key: 'lebanon',
						i18nLabel: 'Country_Lebanon',
					},
					{
						key: 'lesotho',
						i18nLabel: 'Country_Lesotho',
					},
					{
						key: 'liberia',
						i18nLabel: 'Country_Liberia',
					},
					{
						key: 'libyanArabJamahiriya',
						i18nLabel: 'Country_Libyan_Arab_Jamahiriya',
					},
					{
						key: 'liechtenstein',
						i18nLabel: 'Country_Liechtenstein',
					},
					{
						key: 'lithuania',
						i18nLabel: 'Country_Lithuania',
					},
					{
						key: 'luxembourg',
						i18nLabel: 'Country_Luxembourg',
					},
					{
						key: 'macao',
						i18nLabel: 'Country_Macao',
					},
					{
						key: 'macedoniaTheFormerYugoslavRepublicOf',
						i18nLabel: 'Country_Macedonia_The_Former_Yugoslav_Republic_of',
					},
					{
						key: 'madagascar',
						i18nLabel: 'Country_Madagascar',
					},
					{
						key: 'malawi',
						i18nLabel: 'Country_Malawi',
					},
					{
						key: 'malaysia',
						i18nLabel: 'Country_Malaysia',
					},
					{
						key: 'maldives',
						i18nLabel: 'Country_Maldives',
					},
					{
						key: 'mali',
						i18nLabel: 'Country_Mali',
					},
					{
						key: 'malta',
						i18nLabel: 'Country_Malta',
					},
					{
						key: 'marshallIslands',
						i18nLabel: 'Country_Marshall_Islands',
					},
					{
						key: 'martinique',
						i18nLabel: 'Country_Martinique',
					},
					{
						key: 'mauritania',
						i18nLabel: 'Country_Mauritania',
					},
					{
						key: 'mauritius',
						i18nLabel: 'Country_Mauritius',
					},
					{
						key: 'mayotte',
						i18nLabel: 'Country_Mayotte',
					},
					{
						key: 'mexico',
						i18nLabel: 'Country_Mexico',
					},
					{
						key: 'micronesiaFederatedStatesOf',
						i18nLabel: 'Country_Micronesia_Federated_States_of',
					},
					{
						key: 'moldovaRepublicOf',
						i18nLabel: 'Country_Moldova_Republic_of',
					},
					{
						key: 'monaco',
						i18nLabel: 'Country_Monaco',
					},
					{
						key: 'mongolia',
						i18nLabel: 'Country_Mongolia',
					},
					{
						key: 'montserrat',
						i18nLabel: 'Country_Montserrat',
					},
					{
						key: 'morocco',
						i18nLabel: 'Country_Morocco',
					},
					{
						key: 'mozambique',
						i18nLabel: 'Country_Mozambique',
					},
					{
						key: 'myanmar',
						i18nLabel: 'Country_Myanmar',
					},
					{
						key: 'namibia',
						i18nLabel: 'Country_Namibia',
					},
					{
						key: 'nauru',
						i18nLabel: 'Country_Nauru',
					},
					{
						key: 'nepal',
						i18nLabel: 'Country_Nepal',
					},
					{
						key: 'netherlands',
						i18nLabel: 'Country_Netherlands',
					},
					{
						key: 'netherlandsAntilles',
						i18nLabel: 'Country_Netherlands_Antilles',
					},
					{
						key: 'newCaledonia',
						i18nLabel: 'Country_New_Caledonia',
					},
					{
						key: 'newZealand',
						i18nLabel: 'Country_New_Zealand',
					},
					{
						key: 'nicaragua',
						i18nLabel: 'Country_Nicaragua',
					},
					{
						key: 'niger',
						i18nLabel: 'Country_Niger',
					},
					{
						key: 'nigeria',
						i18nLabel: 'Country_Nigeria',
					},
					{
						key: 'niue',
						i18nLabel: 'Country_Niue',
					},
					{
						key: 'norfolkIsland',
						i18nLabel: 'Country_Norfolk_Island',
					},
					{
						key: 'northernMarianaIslands',
						i18nLabel: 'Country_Northern_Mariana_Islands',
					},
					{
						key: 'norway',
						i18nLabel: 'Country_Norway',
					},
					{
						key: 'oman',
						i18nLabel: 'Country_Oman',
					},
					{
						key: 'pakistan',
						i18nLabel: 'Country_Pakistan',
					},
					{
						key: 'palau',
						i18nLabel: 'Country_Palau',
					},
					{
						key: 'palestinianTerritoryOccupied',
						i18nLabel: 'Country_Palestinian_Territory_Occupied',
					},
					{
						key: 'panama',
						i18nLabel: 'Country_Panama',
					},
					{
						key: 'papuaNewGuinea',
						i18nLabel: 'Country_Papua_New_Guinea',
					},
					{
						key: 'paraguay',
						i18nLabel: 'Country_Paraguay',
					},
					{
						key: 'peru',
						i18nLabel: 'Country_Peru',
					},
					{
						key: 'philippines',
						i18nLabel: 'Country_Philippines',
					},
					{
						key: 'pitcairn',
						i18nLabel: 'Country_Pitcairn',
					},
					{
						key: 'poland',
						i18nLabel: 'Country_Poland',
					},
					{
						key: 'portugal',
						i18nLabel: 'Country_Portugal',
					},
					{
						key: 'puertoRico',
						i18nLabel: 'Country_Puerto_Rico',
					},
					{
						key: 'qatar',
						i18nLabel: 'Country_Qatar',
					},
					{
						key: 'reunion',
						i18nLabel: 'Country_Reunion',
					},
					{
						key: 'romania',
						i18nLabel: 'Country_Romania',
					},
					{
						key: 'russianFederation',
						i18nLabel: 'Country_Russian_Federation',
					},
					{
						key: 'rwanda',
						i18nLabel: 'Country_Rwanda',
					},
					{
						key: 'saintHelena',
						i18nLabel: 'Country_Saint_Helena',
					},
					{
						key: 'saintKittsAndNevis',
						i18nLabel: 'Country_Saint_Kitts_and_Nevis',
					},
					{
						key: 'saintLucia',
						i18nLabel: 'Country_Saint_Lucia',
					},
					{
						key: 'saintPierreAndMiquelon',
						i18nLabel: 'Country_Saint_Pierre_and_Miquelon',
					},
					{
						key: 'saintVincentAndTheGrenadines',
						i18nLabel: 'Country_Saint_Vincent_and_The_Grenadines',
					},
					{
						key: 'samoa',
						i18nLabel: 'Country_Samoa',
					},
					{
						key: 'sanMarino',
						i18nLabel: 'Country_San_Marino',
					},
					{
						key: 'saoTomeAndPrincipe',
						i18nLabel: 'Country_Sao_Tome_and_Principe',
					},
					{
						key: 'saudiArabia',
						i18nLabel: 'Country_Saudi_Arabia',
					},
					{
						key: 'senegal',
						i18nLabel: 'Country_Senegal',
					},
					{
						key: 'serbiaAndMontenegro',
						i18nLabel: 'Country_Serbia_and_Montenegro',
					},
					{
						key: 'seychelles',
						i18nLabel: 'Country_Seychelles',
					},
					{
						key: 'sierraLeone',
						i18nLabel: 'Country_Sierra_Leone',
					},
					{
						key: 'singapore',
						i18nLabel: 'Country_Singapore',
					},
					{
						key: 'slovakia',
						i18nLabel: 'Country_Slovakia',
					},
					{
						key: 'slovenia',
						i18nLabel: 'Country_Slovenia',
					},
					{
						key: 'solomonIslands',
						i18nLabel: 'Country_Solomon_Islands',
					},
					{
						key: 'somalia',
						i18nLabel: 'Country_Somalia',
					},
					{
						key: 'southAfrica',
						i18nLabel: 'Country_South_Africa',
					},
					{
						key: 'southGeorgiaAndTheSouthSandwichIslands',
						i18nLabel: 'Country_South_Georgia_and_The_South_Sandwich_Islands',
					},
					{
						key: 'spain',
						i18nLabel: 'Country_Spain',
					},
					{
						key: 'sriLanka',
						i18nLabel: 'Country_Sri_Lanka',
					},
					{
						key: 'sudan',
						i18nLabel: 'Country_Sudan',
					},
					{
						key: 'suriname',
						i18nLabel: 'Country_Suriname',
					},
					{
						key: 'svalbardAndJanMayen',
						i18nLabel: 'Country_Svalbard_and_Jan_Mayen',
					},
					{
						key: 'swaziland',
						i18nLabel: 'Country_Swaziland',
					},
					{
						key: 'sweden',
						i18nLabel: 'Country_Sweden',
					},
					{
						key: 'switzerland',
						i18nLabel: 'Country_Switzerland',
					},
					{
						key: 'syrianArabRepublic',
						i18nLabel: 'Country_Syrian_Arab_Republic',
					},
					{
						key: 'taiwanProvinceOfChina',
						i18nLabel: 'Country_Taiwan_Province_of_China',
					},
					{
						key: 'tajikistan',
						i18nLabel: 'Country_Tajikistan',
					},
					{
						key: 'tanzaniaUnitedRepublicOf',
						i18nLabel: 'Country_Tanzania_United_Republic_of',
					},
					{
						key: 'thailand',
						i18nLabel: 'Country_Thailand',
					},
					{
						key: 'timorLeste',
						i18nLabel: 'Country_Timor_leste',
					},
					{
						key: 'togo',
						i18nLabel: 'Country_Togo',
					},
					{
						key: 'tokelau',
						i18nLabel: 'Country_Tokelau',
					},
					{
						key: 'tonga',
						i18nLabel: 'Country_Tonga',
					},
					{
						key: 'trinidadAndTobago',
						i18nLabel: 'Country_Trinidad_and_Tobago',
					},
					{
						key: 'tunisia',
						i18nLabel: 'Country_Tunisia',
					},
					{
						key: 'turkey',
						i18nLabel: 'Country_Turkey',
					},
					{
						key: 'turkmenistan',
						i18nLabel: 'Country_Turkmenistan',
					},
					{
						key: 'turksAndCaicosIslands',
						i18nLabel: 'Country_Turks_and_Caicos_Islands',
					},
					{
						key: 'tuvalu',
						i18nLabel: 'Country_Tuvalu',
					},
					{
						key: 'uganda',
						i18nLabel: 'Country_Uganda',
					},
					{
						key: 'ukraine',
						i18nLabel: 'Country_Ukraine',
					},
					{
						key: 'unitedArabEmirates',
						i18nLabel: 'Country_United_Arab_Emirates',
					},
					{
						key: 'unitedKingdom',
						i18nLabel: 'Country_United_Kingdom',
					},
					{
						key: 'unitedStates',
						i18nLabel: 'Country_United_States',
					},
					{
						key: 'unitedStatesMinorOutlyingIslands',
						i18nLabel: 'Country_United_States_Minor_Outlying_Islands',
					},
					{
						key: 'uruguay',
						i18nLabel: 'Country_Uruguay',
					},
					{
						key: 'uzbekistan',
						i18nLabel: 'Country_Uzbekistan',
					},
					{
						key: 'vanuatu',
						i18nLabel: 'Country_Vanuatu',
					},
					{
						key: 'venezuela',
						i18nLabel: 'Country_Venezuela',
					},
					{
						key: 'vietNam',
						i18nLabel: 'Country_Viet_Nam',
					},
					{
						key: 'virginIslandsBritish',
						i18nLabel: 'Country_Virgin_Islands_British',
					},
					{
						key: 'virginIslandsUS',
						i18nLabel: 'Country_Virgin_Islands_US',
					},
					{
						key: 'wallisAndFutuna',
						i18nLabel: 'Country_Wallis_and_Futuna',
					},
					{
						key: 'westernSahara',
						i18nLabel: 'Country_Western_Sahara',
					},
					{
						key: 'yemen',
						i18nLabel: 'Country_Yemen',
					},
					{
						key: 'zambia',
						i18nLabel: 'Country_Zambia',
					},
					{
						key: 'zimbabwe',
						i18nLabel: 'Country_Zimbabwe',
					},
					{
						key: 'worldwide',
						i18nLabel: 'Worldwide',
					},
				],
				wizard: {
					step: 2,
					order: 4,
				},
			});
			await this.add('Website', '', {
				type: 'string',
				wizard: {
					step: 2,
					order: 5,
				},
			});
			await this.add('Server_Type', '', {
				type: 'select',
				values: [
					{
						key: 'privateTeam',
						i18nLabel: 'Private_Team',
					},
					{
						key: 'publicCommunity',
						i18nLabel: 'Public_Community',
					},
				],
				wizard: {
					step: 3,
					order: 2,
				},
			});
			await this.add('Allow_Marketing_Emails', true, {
				type: 'boolean',
			});
			await this.add('Register_Server', false, {
				type: 'boolean',
			});
			await this.add('Organization_Email', '', {
				type: 'string',
			});
			await this.add('Triggered_Emails_Count', 0, {
				type: 'int',
				hidden: true,
			});
		});
		await this.section('Cloud_Info', async function () {
			await this.add('Nps_Url', 'https://nps.rocket.chat', {
				type: 'string',
				hidden: true,
				readonly: true,
				enableQuery: {
					_id: 'Register_Server',
					value: true,
				},
				secret: true,
			});

			await this.add('Cloud_Workspace_Supported_Versions_Token', '', {
				type: 'string',
				hidden: true,
				readonly: true,
				secret: true,
			});

			await this.add('Cloud_Url', 'https://cloud.rocket.chat', {
				type: 'string',
				hidden: true,
				readonly: true,
				enableQuery: {
					_id: 'Register_Server',
					value: true,
				},
				secret: true,
			});

			await this.add('Omnigateway_Url', 'https://omni-gateway.rocket.chat', {
				type: 'string',
				hidden: true,
				secret: true,
				readonly: true,
			});

			await this.add('Cloud_Service_Agree_PrivacyTerms', false, {
				type: 'boolean',
			});

			await this.add('Cloud_Workspace_Id', '', {
				type: 'string',
				hidden: true,
				readonly: true,
				enableQuery: {
					_id: 'Register_Server',
					value: true,
				},
				secret: true,
			});

			await this.add('Cloud_Workspace_Name', '', {
				type: 'string',
				hidden: true,
				readonly: true,
				enableQuery: {
					_id: 'Register_Server',
					value: true,
				},
				secret: true,
			});

			await this.add('Cloud_Workspace_Client_Id', '', {
				type: 'string',
				hidden: true,
				readonly: true,
				enableQuery: {
					_id: 'Register_Server',
					value: true,
				},
				secret: true,
			});

			await this.add('Cloud_Workspace_Client_Secret', '', {
				type: 'string',
				hidden: true,
				readonly: true,
				enableQuery: {
					_id: 'Register_Server',
					value: true,
				},
				secret: true,
			});

			await this.add('Cloud_Workspace_Client_Secret_Expires_At', 0, {
				type: 'int',
				hidden: true,
				readonly: true,
				enableQuery: {
					_id: 'Register_Server',
					value: true,
				},
				secret: true,
			});

			await this.add('Cloud_Workspace_Registration_Client_Uri', '', {
				type: 'string',
				hidden: true,
				readonly: true,
				enableQuery: {
					_id: 'Register_Server',
					value: true,
				},
				secret: true,
			});

			await this.add('Cloud_Workspace_PublicKey', '', {
				type: 'string',
				hidden: true,
				readonly: true,
				enableQuery: {
					_id: 'Register_Server',
					value: true,
				},
				secret: true,
			});

			await this.add('Cloud_Workspace_License', '', {
				type: 'string',
				hidden: true,
				readonly: true,
				enableQuery: {
					_id: 'Register_Server',
					value: true,
				},
				secret: true,
			});

			await this.add('Cloud_Workspace_Had_Trial', false, {
				type: 'boolean',
				hidden: true,
				readonly: true,
				secret: true,
			});

			await this.add('Cloud_Workspace_Registration_State', '', {
				type: 'string',
				hidden: true,
				readonly: true,
				enableQuery: {
					_id: 'Register_Server',
					value: true,
				},
				secret: true,
			});
			await this.add('Cloud_Billing_Url', 'https://billing.rocket.chat', {
				type: 'string',
				hidden: true,
				readonly: true,
				enableQuery: {
					_id: 'Register_Server',
					value: true,
				},
				secret: true,
			});
			await this.add('Cloud_Sync_Announcement_Payload', 'null', {
				type: 'string', // TODO: replace setting type string for object once is implemented.
				hidden: true,
				secret: true,
			});
		});
	});
