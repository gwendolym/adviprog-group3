import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { buildDays, buildGridColumns, buildGridMinWidth, buildTimes } from '$lib/availability';

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
	const event = data as EventData;
	const days = buildDays(event.dates);

	return {
		event,
		times: buildTimes(event.startTime, event.endTime),
		days,
		gridColumns: buildGridColumns(days.length),
		gridMinWidth: buildGridMinWidth(days.length)
	};
};
