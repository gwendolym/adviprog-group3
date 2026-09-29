import adapter from '@sveltejs/adapter-static';

export default {
	compilerOptions: {
		runes: ({ filename }) =>
			filename.split(/[/\\]/).includes('node_modules') ? undefined : true
	},
	kit: {
		adapter: adapter({ fallback: 'index.html' }),
		env: { dir: '..' }
	}
};