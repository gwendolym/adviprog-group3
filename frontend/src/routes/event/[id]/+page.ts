import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export type EventData = {
	name: string;
	dates: string[];
	startTime: string;
	endTime: string;
	timezone: string;
};

export const load: PageLoad = async ({ params, fetch }) => {
	const response = await fetch(`/api/events/${params.id}`);
	const data = await response.json();

	if (!response.ok || data === 'Event not found') {
		throw error(404, 'Event not found');
	}

	return { event: data as EventData };
};