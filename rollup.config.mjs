import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import nodePolyfills from 'rollup-plugin-polyfill-node';

export default {
	input: ['src/index.ts'],
	output: [{
			file: 'dist/index.min.js',
			format: 'iife',
			name: 'keycloakjs',
			plugins: [
				terser(),
			],
		}, { // TODO: Just copy.
			file: 'sample-app/index.min.js',
			format: 'iife',
			name: 'keycloakjs',
			plugins: [
				terser(),
			],
		}, {
			file: 'dist/index.cjs',
			format: 'cjs',
		}, {
			file: 'dist/index.mjs',
			format: 'esm',
		},
	],
	plugins: [
		typescript(),
		nodeResolve({ preferBuiltins: true, browser: true }),
		commonjs(),
		json(),
		nodePolyfills(),
	],
};
