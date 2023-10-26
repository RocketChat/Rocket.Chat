import path from 'path';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import 'webpack-dev-server';

// Helper to use absolute paths in the webpack config
const _ = (p: string) => path.resolve(__dirname, p);

const common = (args: webpack.CliConfigOptions): Partial<webpack.Configuration> => ({
	stats: 'errors-warnings',
	mode: args.mode,
	devtool: args.mode === 'production' ? 'source-map' : 'eval',
	resolve: {
		extensions: ['.js', '.jsx', '.ts', '.tsx'],
		alias: {
			'react': 'preact/compat',
			'react-dom': 'preact/compat',
		},
	},
	optimization: {
		sideEffects: false,
		splitChunks: {
			automaticNameDelimiter: '~',
			chunks: 'all',
			maxAsyncRequests: 30,
			maxInitialRequests: 30,
			minChunks: 1,
			minSize: 20000,
			maxSize: 0,
		},
		noEmitOnErrors: true,
		...(args.mode === 'production' && {
			minimizer: [
				new TerserPlugin({
					terserOptions: {
						mangle: true,
					},
				}),
			],
		}),
	},
});

const config: webpack.MultiConfigurationFactory = (_env, args) => [
	{
		...common(args),
		entry: {
			bundle: ['core-js', 'regenerator-runtime/runtime', _('./src/entry')],
			polyfills: _('./src/polyfills'),
		} as webpack.Entry,
		output: {
			path: _('./dist'),
			publicPath: args.mode === 'production' ? 'livechat/' : '/',
			filename: args.mode === 'production' ? '[name].[chunkhash:5].js' : '[name].js',
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
					exclude: [_('./src/components'), _('./src/routes')],
					use: [
						args.mode === 'production' ? MiniCssExtractPlugin.loader : 'style-loader',
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
					include: [_('./src/components'), _('./src/routes')],
					use: [
						args.mode === 'production' ? MiniCssExtractPlugin.loader : 'style-loader',
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
					loader: args.mode === 'production' ? 'file-loader' : 'url-loader',
				},
			],
		},
		plugins: [
			new MiniCssExtractPlugin({
				filename: args.mode === 'production' ? '[name].[contenthash:5].css' : '[name].css',
				chunkFilename: args.mode === 'production' ? '[name].chunk.[contenthash:5].css' : '[name].chunk.css',
			}) as unknown as webpack.Plugin,
			new webpack.DefinePlugin({
				'process.env.NODE_ENV': JSON.stringify(args.mode === 'production' ? 'production' : 'development'),
			}),
			new HtmlWebpackPlugin({
				title: 'Livechat - Rocket.Chat',
				chunks: ['polyfills', 'vendor', 'bundle'],
				chunksSortMode: 'manual',
			}),
		],
		devServer: {
			hot: true,
			port: 8080,
			host: '0.0.0.0',
			allowedHosts: 'all',
			open: true,
			devMiddleware: {
				publicPath: args.mode === 'production' ? 'livechat/' : '/',
				stats: 'normal',
			},
			client: {
				logging: 'verbose',
			},
			static: {
				directory: _('./src'),
				publicPath: args.mode === 'production' ? 'livechat/' : '/',
				watch: {
					ignored: [_('./dist'), _('./node_modules')],
				},
			},
		},
	},
	{
		...common(args),
		entry: {
			script: _('./src/widget.js'),
		} as webpack.Entry,
		output: {
			path: _('./dist'),
			publicPath: args.mode === 'production' ? 'livechat/' : '/',
			filename: 'rocketchat-livechat.min.js',
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: 'babel-loader',
					exclude: ['/node_modules/'],
				},
			],
		},
	},
];

export default config;
