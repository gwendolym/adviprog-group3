import { page } from 'vitest/browser';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Layout from '../../routes/+layout.svelte';

const children = createRawSnippet(() => ({	// Create a Svelte snippet called children that renders an empty <div>.
	render: () => '<div></div>'
}));

describe('Layout.svelte', () => {
	it('shows the DH2643 course in the footer', async () => {
		render(Layout, { children });

		await expect.element(page.getByText('DH2642')).not.toBeInTheDocument();
		await expect.element(page.getByText('DH2643')).toBeInTheDocument();	// Make sure its the right course code 
	});
});