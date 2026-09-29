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

	if (!response.ok) {
		error(404, 'Event not found');
	}

	const data = await response.json();

	return { event: data as EventData };
};