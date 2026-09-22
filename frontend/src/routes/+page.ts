export async function load({ fetch }) {
	const res = await fetch('/api/hello');
	return { message: (await res.text()) + ' This message is from the frontend' };
}
