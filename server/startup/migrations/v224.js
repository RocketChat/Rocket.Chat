import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

// Migrations.add({
// 	version: 224,
// 	up() {
// 		Settings.remove({ _id: 'UTF8_Names_Validation' });
// 		console.log('Removed Setting UTF8_Names_Validation');
// 	},
// });

function removeM(){
    Settings.remove({ _id: 'UTF8_Names_Validation' });
    console.log('Removed Setting UTF8_Names_Validation');
}

removeM();