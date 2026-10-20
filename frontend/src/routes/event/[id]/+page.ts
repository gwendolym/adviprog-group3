import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { buildDays, buildGridColumns, buildGridMinWidth, buildTimes } from '$lib/availability';

export type EventData = {
	name: string;
	dates: string[];
	startTime: string;
	endTime: string;
	timezone: string;
	meetUrl: string | null;
	creatorId: number | null;
	creator: {
		id: number;
		name: string;
		email: string;
	} | null;
	team: { id: string; name: string } | null;
	isPublic: boolean;
};

export const load: PageLoad = async function load({ params, fetch }) {
	const response = await fetch(`/api/events/${params.id}`);

	if (response.status === 403) {
		error(403, "You're not a member of this event's team");
	}

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
