import { Settings } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 234,
	up() {
		return Settings.deleteMany({
			_id: {
				$in: [
					'GoogleVision_Enable',
					'GoogleVision_ServiceAccount',
					'GoogleVision_Max_Monthly_Calls',
					'GoogleVision_Current_Month',
					'GoogleVision_Current_Month_Calls',
					'GoogleVision_Type_Document',
					'GoogleVision_Type_Faces',
					'GoogleVision_Type_Landmarks',
					'GoogleVision_Type_Labels',
					'GoogleVision_Type_Logos',
					'GoogleVision_Type_Properties',
					'GoogleVision_Type_SafeSearch',
					'GoogleVision_Block_Adult_Images',
					'GoogleVision_Type_Similar',
				],
			},
		});
	},
});
