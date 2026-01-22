import { normalizeDate } from './src/lib/data-processor';

function normalizeDateTimeDebug(val: string): string | null {
    val = val.trim();
    console.log(`Input: "${val}"`);

    const timeMarkerMatch = val.match(/(오전|오후|am|pm|[\d]{1,2}:[\d]{1,2}(?::[\d]{1,2})?)/i);
    console.log('Time Marker Match:', timeMarkerMatch ? timeMarkerMatch[0] : 'NONE');
    if (!timeMarkerMatch) return null;

    const datePart = normalizeDate(val);
    console.log('Date Part Extracted:', datePart);
    if (!datePart) return null;

    const timeMatch = val.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    console.log('Time Match:', timeMatch ? `H:${timeMatch[1]} M:${timeMatch[2]} S:${timeMatch[3]}` : 'NONE');
    if (!timeMatch) return null;

    let hh = parseInt(timeMatch[1]);
    const mm = timeMatch[2].padStart(2, '0');
    const ss = (timeMatch[3] || '0').padStart(2, '0');

    const isAfternoon = /오후|pm/i.test(val);
    const isMorning = /오전|am/i.test(val);
    console.log('IsAfternoon:', isAfternoon, 'IsMorning:', isMorning);

    if (isAfternoon && hh < 12) {
        hh += 12;
    } else if (isMorning && hh === 12) {
        hh = 0;
    }

    const finalTime = `${String(hh).padStart(2, '0')}:${mm}:${ss}`;
    console.log('Final Time:', finalTime);
    return `${datePart} ${finalTime}`;
}

normalizeDateTimeDebug('2024-01-22 오후 02:30:15');
console.log('---');
normalizeDateTimeDebug('9/2/2021 10:15 AM');
