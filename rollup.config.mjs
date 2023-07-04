import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

export default {
	input: ['src/index.ts'],
	output: [{
			file: 'dist/index.min.js',
			format: 'iife',
			name: 'keycloakjssimple',
			plugins: [
				terser(),
			],
		}, {
			file: 'sample-app/index.min.js',
			format: 'iife',
			name: 'keycloakjssimple',
			plugins: [
				terser(),
			],
		},
	],
	plugins: [
		typescript(),
		nodeResolve({ preferBuiltins: true, browser: true }),
		commonjs(),
		json(),
	],
};
