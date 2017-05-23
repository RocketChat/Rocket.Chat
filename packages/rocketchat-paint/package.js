Package.describe({
	name: 'rocketchat:paint',
	version: '0.0.1',
	// paintchat and its libraries
	summary: '',
	// URL to the Git repository containing the source code for this package.
	git: '',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md'
});

Package.onUse(function (api) {
	api.versionsFrom('1.2.1');
	api.use([
		'coffeescript',
		'ecmascript',
		'templating',
		'less',
		'underscore',
		'reactive-var',
		'deps',
		'ejson',
		'ryanswapp:spectrum-colorpicker@0.0.1',
		'hitchcott:panzoom@1.0.1',
		'fortawesome:fontawesome@4.5.0',
		'rocketchat:lib@0.0.1',
	]);

	//Both:
	api.addFiles([
			'both/model/images.js',
			'both/model/likes.js',
			'both/model/presences.js',
			'both/model/strokeArchives.js',
			'both/model/strokes.js',
			'both/model/users.js',
		],
		['client', 'server']);

	//Server:
	api.addFiles([
			'server/collections/images.js',
			'server/collections/likes.js',
			'server/collections/presences.js',
			'server/collections/strokes.js',
			'server/methods/saveImage.js',
			'server/methods/saveStroke.js',
			'server/methods/saveThumb.js'
		],
		['server']);

	api.addAssets([
		'public/textures/chalk1-128.png',
		'public/textures/chalk2-128.png',
		'public/textures/chalk3-128.png',
		'public/textures/chalk4-128.png',
		'public/textures/speckled-128.png',
		'public/textures/brush6-128.png',
	], ['client']);

	//Client - compatibility
	api.addFiles([
		'client/compatibility/glbrush/g000_hsl.js',
		'client/compatibility/glbrush/g010_util2d.js',
		//'client/compatibility/glbrush/g015_util2d_painting.js', //merged into util2d.js (revert)
		'client/compatibility/glbrush/g020_utilgl.js',
		'client/compatibility/glbrush/g030_blit_shader.js',
		'client/compatibility/glbrush/g040_rasterize_shader.js',
		//'client/compatibility/glbrush/g050_gradient_shader.js', //merged into rasterize_shader.js (revert)
		'client/compatibility/glbrush/g060_compositing_shader.js',
		'client/compatibility/glbrush/g070_brush_tip_mover.js',
		'client/compatibility/glbrush/g080_brush_textures.js',
		'client/compatibility/glbrush/g090_compositor.js',
		'client/compatibility/glbrush/g100_picture_event.js',
		'client/compatibility/glbrush/g110_rasterize.js',
		'client/compatibility/glbrush/g120_picture_buffer.js',
		'client/compatibility/glbrush/g130_undo_state.js',
		'client/compatibility/glbrush/g140_picture_update.js',
		'client/compatibility/glbrush/g150_picture.js',
		'client/compatibility/glbrush/g160_picture_renderer.js',
		'client/compatibility/pep.js',
	], ['client'], {bare: true}); //bare:true does not encapsulate like compatibility

	//Client:
	api.addFiles([

			'client/lib/tools/001_baseTool.js',
			'client/lib/tools/002_BrushTool.js',
			'client/lib/tools/003_ColorPicker.js',
			'client/lib/tools/004_EraserTool.js',
			'client/lib/tools/005_PanMoveTool.js',
			'client/lib/tools/006_ZoomTool.js',
			'client/lib/paintchat.js',
			'client/lib/observable.js',
			'client/lib/nextAnywhere.js',
			'client/lib/_area.js',
			'client/lib/_presences.js',
			'client/utils/_helpers.js',
			'client/utils/canvas.js',
			'client/utils/closestData.js',
			'client/utils/forms.js',
			'client/utils/language.js',
			'client/utils/logic.html',
			'client/utils/logic.js',
			'client/utils/observable.js',
			'client/views/drawing_board/cursor.less',
			'client/stylesheets/global/_variables.less',
			'client/stylesheets/style.less',
			'client/views/drawing_board/roomButtons.html',
			'client/views/drawing_board/roomButtons.js',
			'client/views/drawing_board/roomButtons.less',
			'client/views/drawing_board/toolPanel.html',
			'client/views/drawing_board/toolPanel.js',
			'client/views/drawing_board/toolPanel.less',
			'client/views/drawing_board/brushSettings.html',
			'client/views/drawing_board/brushSettings.js',
			'client/views/drawing_board/brushSettings.less',
			'client/views/drawing_board/drawingCanvas.html',
			'client/views/drawing_board/drawingCanvas.js',
			'client/views/drawing_board/drawingCanvas.less',
			'client/views/drawing_board/drawingBoardMain.html',
			'client/views/drawing_board/drawingBoardMain.js',
			'client/views/drawing_board/drawingBoardMain.less',
			'client/views/drawing_board/notAbleToDraw.html',
			'client/views/drawing_board/notAbleToDraw.js',
			'client/views/drawing_board/drawingBoard.html',
			'client/views/drawing_board/drawingBoard.js',
			'client/views/drawing_board/drawingBoard.less',
			'client/views/paintChatFlexTab.html',
			'client/views/paintChatFlexTab.js',
			'client/tabBar.coffee',
		],
		['client']);


	api.export("PaintChat", 'client');
	//api.export("Picture", 'client');
	//api.export("Rect", 'client');
});


Package.onTest(function (api) {
	/*
	 api.use('ecmascript');
	 api.use('tinytest');
	 api.use('paintchat:paintchat-main');
	 api.addFiles('paintchat-main-tests.js');
	 */
});

