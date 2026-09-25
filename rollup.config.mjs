import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import nodePolyfills from 'rollup-plugin-polyfill-node';

const browserPlugins = [
	typescript(),
	nodeResolve({ preferBuiltins: true, browser: true }),
	commonjs(),
	json(),
	nodePolyfills(),
];

const backendPlugins = [
	typescript(),
	nodeResolve({ preferBuiltins: true, browser: false }),
	commonjs(),
	json(),
];

export default [
	// Frontend/browser build
	{
		input: 'src/index.ts',
		output: [
			{
				file: 'dist/index.min.js',
				format: 'iife',
				name: 'keycloakjs',
				plugins: [
					terser(),
				],
			},
			{
				file: 'sample-app/index.min.js',
				format: 'iife',
				name: 'keycloakjs',
				plugins: [
					terser(),
				],
			},
			{
				file: 'dist/index.cjs',
				format: 'cjs',
			},
			{
				file: 'dist/index.mjs',
				format: 'esm',
			},
		],
		plugins: browserPlugins,
	},
	// Backend build
	{
		input: 'src/validate.ts',
		output: [
			{
				file: 'dist/validate.cjs',
				format: 'cjs',
			},
			{
				file: 'dist/validate.mjs',
				format: 'esm',
			},
		],
		plugins: backendPlugins,
	},
];
