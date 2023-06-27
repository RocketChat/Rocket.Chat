const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => [
	{
		stats: 'errors-warnings',
		mode: argv.mode,
		devtool: argv.mode === 'production' ? 'source-map' : 'eval',
		resolve: {
			extensions: ['.js', '.jsx', '.ts', '.tsx'],
			alias: {
				'react': 'preact/compat',
				'react-dom': 'preact/compat',
			},
		},
		node: {
			console: false,
			process: false,
			Buffer: false,
			__filename: false,
			__dirname: false,
			setImmediate: false,
		},
		entry: {
			bundle: ['core-js', 'regenerator-runtime/runtime', path.resolve(__dirname, './src/entry')],
			polyfills: path.resolve(__dirname, './src/polyfills'),
		},
		output: {
			path: path.resolve(__dirname, './dist'),
			publicPath: argv.mode === 'production' ? 'livechat/' : '/',
			filename: argv.mode === 'production' ? '[name].[chunkhash:5].js' : '[name].js',
			chunkFilename: '[name].chunk.[chunkhash:5].js',
		},
		module: {
			rules: [
				{
					test: /\.jsx?$/,
					exclude: [/\/node_modules\/core-js\//],
					type: 'javascript/auto',
					use: ['babel-loader'],
				},
				{
					test: /\.tsx?$/,
					use: 'babel-loader',
					exclude: ['/node_modules/'],
				},
				{
					test: /\.svg$/,
					use: [require.resolve('./svg-component-loader'), 'svg-loader', 'image-webpack-loader'],
				},
				{
					test: /\.s?css$/,
					exclude: [path.resolve(__dirname, './src/components'), path.resolve(__dirname, './src/routes')],
					use: [
						argv.mode === 'production' ? MiniCssExtractPlugin.loader : 'style-loader',
						{
							loader: 'css-loader',
							options: {
								importLoaders: 1,
								sourceMap: true,
							},
						},
						{
							loader: 'postcss-loader',
							options: {
								ident: 'postcss',
								sourceMap: true,
							},
						},
					],
				},
				{
					test: /\.s?css$/,
					include: [path.resolve(__dirname, './src/components'), path.resolve(__dirname, './src/routes')],
					use: [
						argv.mode === 'production' ? MiniCssExtractPlugin.loader : 'style-loader',
						{
							loader: 'css-loader',
							options: {
								modules: {
									localIdentName: '[local]__[hash:base64:5]',
								},
								importLoaders: 1,
								sourceMap: true,
							},
						},
						{
							loader: 'postcss-loader',
							options: {
								ident: 'postcss',
								sourceMap: true,
							},
						},
					],
				},
				{
					enforce: 'pre',
					test: /\.scss$/,
					use: [
						{
							loader: 'sass-loader',
							options: {
								sassOptions: {
									fiber: false,
								},
							},
						},
					],
				},
				{
					test: /\.(woff2?|ttf|eot|jpe?g|png|webp|gif|mp4|mov|ogg|webm)(\?.*)?$/i,
					loader: argv.mode === 'production' ? 'file-loader' : 'url-loader',
				},
			],
		},
		plugins: [
			new MiniCssExtractPlugin({
				filename: argv.mode === 'production' ? '[name].[contenthash:5].css' : '[name].css',
				chunkFilename: argv.mode === 'production' ? '[name].chunk.[contenthash:5].css' : '[name].chunk.css',
			}),
			new webpack.NoEmitOnErrorsPlugin(),
			new webpack.DefinePlugin({
				'process.env.NODE_ENV': JSON.stringify(argv.mode === 'production' ? 'production' : 'development'),
			}),
			new HtmlWebpackPlugin({
				title: 'Rocket.Chat.Livechat',
				chunks: ['polyfills', 'vendor', 'bundle'],
				chunksSortMode: 'manual',
			}),
		],
		optimization: {
			sideEffects: false,
			splitChunks: {
				automaticNameDelimiter: '~',
				chunks: 'all',
				maxAsyncRequests: 30,
				maxInitialRequests: 30,
				minChunks: 1,
				minSize: 20000,
				enforceSizeThreshold: 500000,
				maxSize: 0,
			},
		},
		devServer: {
			hot: true,
			port: 8080,
			host: '0.0.0.0',
			allowedHosts: 'all',
			open: true,
			historyApiFallback: true,
			devMiddleware: {
				publicPath: argv.mode === 'production' ? 'livechat/' : '/',
				stats: 'normal',
			},
			client: {
				logging: 'verbose',
			},
			static: {
				directory: path.resolve(__dirname, './src'),
				publicPath: argv.mode === 'production' ? 'livechat/' : '/',
				watch: {
					ignored: [path.resolve(__dirname, './dist'), path.resolve(__dirname, './node_modules')],
				},
			},
		},
	},
	{
		stats: 'errors-warnings',
		mode: argv.mode,
		devtool: argv.mode === 'production' ? 'source-map' : 'eval',
		resolve: {
			extensions: ['.js', '.jsx', '.ts', '.tsx'],
			alias: {
				'react': 'preact/compat',
				'react-dom': 'preact/compat',
			},
		},
		node: {
			console: false,
			process: false,
			Buffer: false,
			__filename: false,
			__dirname: false,
			setImmediate: false,
		},
		entry: {
			script: path.resolve(__dirname, './src/widget.js'),
		},
		output: {
			path: path.resolve(__dirname, './dist'),
			publicPath: argv.mode === 'production' ? 'livechat/' : '/',
			filename: 'rocketchat-livechat.min.js',
		},
		module: {
			rules: [
				{
					test: /\.js$/,
					type: 'javascript/auto',
					use: [
						{
							loader: 'babel-loader',
							options: {
								babelrc: false,
								presets: [
									[
										'@babel/preset-env',
										{
											useBuiltIns: 'entry',
											corejs: 3,
										},
									],
								],
							},
						},
					],
				},
				{
					test: /\.tsx?$/,
					use: 'babel-loader',
					exclude: ['/node_modules/'],
				},
			],
		},
	},
];
