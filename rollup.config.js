export default [
	{
		input: './three-vr-orbitcontrols.js',
		external: ['three'],
		plugins: [
		],
		output: [
			{
				format: 'esm',
				file: 'build/three-vr-orbitcontrols.module.js'
			}
		]
	}
];
