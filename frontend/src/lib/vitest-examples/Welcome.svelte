<script>
	import { greet } from './greet';

	let { host = 'SvelteKit', guest = 'Vitest' } = $props(); // Svelte updates component props.
</script>

<h1>{greet(host)}</h1>
<p>{greet(guest)}</p>
