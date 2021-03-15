import { Migrations } from "../../../app/migrations";
import { Settings } from "../../../app/models";

Migrations.add({
	version: 219,
	up() {
		Settings.remove({ _id: "UTF8_Names_Validation" });
		console.log("Removed Setting UTF8_Names_Validation");
	},
});
