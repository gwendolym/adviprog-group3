import { describe, expect, it } from 'vitest';
import { buildTimes } from '.././availability';

describe('buildTimes', () => {
	it('lists every hour from start to end', () => {
		expect(buildTimes('09:00', '11:00')).toEqual(['09:00', '10:00', '11:00']);
	});

	it('wraps past midnight', () => {
		expect(buildTimes('23:00', '01:00')).toEqual(['23:00', '00:00', '01:00']);
	});

	it('returns one hour when start equals end', () => {
		expect(buildTimes('09:00', '09:00')).toEqual(['09:00']);
	});
});