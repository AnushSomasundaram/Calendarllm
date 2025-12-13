import { useState, useRef } from 'react';

/*
 * A custom hook that encapsulates all event-related logic for the
 * FullCalendar component. It manages the current events in React state,
 * exposes a ref for the calendar instance, and defines handler functions
 * for adding, editing, and removing events. By separating this logic into
 * its own module, the main Calendar component becomes more focused on
 * layout and rendering concerns.
 */

// Counter used to generate unique IDs for new events. IDs must be strings.
let eventGuid = 5;
function createEventId() {
  return String(eventGuid++);
}

export default function useCalendarEvents(initialEvents) {
  const [currentEvents, setCurrentEvents] = useState(initialEvents);
  const calendarRef = useRef(null);

  /**
   * Handle selection of a date or time range. When the user selects a
   * range (for example, dragging across the month or week view), prompt
   * them for an event title. If they provide one, add the event to the
   * calendar. The calendar API comes from the selectInfo.view.
   */
  function handleDateSelect(selectInfo) {
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
    const title = window.prompt('Enter a title for your new event');
    if (title) {
      calendarApi.addEvent({
        id: createEventId(),
        title,
        start: selectInfo.start,
        end: selectInfo.end,
        allDay: selectInfo.allDay,
      });
    }
  }

  /**
   * Handle clicking on an existing event. Prompt the user for a new title
   * (press cancel to leave unchanged) and optionally remove the event if
   * the user leaves the prompt blank. Event modifications are made
   * directly via the FullCalendar Event API.
   */
  function handleEventClick(clickInfo) {
    const newTitle = window.prompt(
      'Edit event title (leave blank to delete)',
      clickInfo.event.title
    );
    if (newTitle === null) {
      return; // user cancelled
    }
    if (newTitle === '') {
      clickInfo.event.remove();
    } else {
      clickInfo.event.setProp('title', newTitle);
    }
  }

  /**
   * Sync the currentEvents state whenever events are added, changed, or
   * removed. The events parameter is an array of Event API objects. We
   * convert them to plain objects to ensure the state remains
   * serializable. FullCalendar accepts Event objects or plain objects.
   */
  function handleEvents(events) {
    setCurrentEvents(
      events.map((evt) => ({
        id: evt.id,
        title: evt.title,
        start: evt.start,
        end: evt.end,
        allDay: evt.allDay,
      }))
    );
  }

  /**
   * Programmatically add a new event to the calendar. This function can
   * be called from a UI button or other event handlers. It generates
   * a unique ID for the event and forwards all other fields to the
   * FullCalendar API. The caller should provide at least a title and
   * a start date string. If end is omitted, it defaults to start.
   *
   * @param {Object} eventData - Partial event data containing title,
   *        start, end, and allDay. Additional fields will be passed
   *        through to FullCalendar. When end is not provided, it
   *        defaults to start, creating a single-day all-day event.
   */
  function addNewEvent(eventData) {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;
    const { start, end, allDay, ...rest } = eventData;
    const eventStart = start;
    const eventEnd = end ?? start;
    calendarApi.addEvent({
      id: createEventId(),
      start: eventStart,
      end: eventEnd,
      allDay: allDay ?? false,
      ...rest,
    });
  }

  return {
    currentEvents,
    calendarRef,
    handleDateSelect,
    handleEventClick,
    handleEvents,
    addNewEvent,
  };
}