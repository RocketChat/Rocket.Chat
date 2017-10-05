Template.chatops_codemirror.helpers({
	editorOptions() {
		return {lineNumbers: true, mode:'javascript'};
	},

	editorCode() {
		return '# This is a full featured, syntax highlighted editor\n# BOTs can fetch, edit, commit, and save source code\n#\n\nvar express = require("express");\nvar app = express();\n// respond with \"hello world\" when a GET request is made to the homepage \ +\napp.get("/", function(req, res) {\nres.send("hello world");\n});';
	}
});
