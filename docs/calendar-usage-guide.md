# Calendar Usage Guide

This guide explains how to view the calendar, add or update events, export the updated event data, and publish the changes to the static site.

## View the Calendar

1. Open the site page that contains the `Calendar` section.
2. Wait for the calendar to finish loading. If event data cannot be loaded, the calendar shows `Calendar data could not be loaded.`
3. Use `Month` to see the full month grid.
4. Use `Week` to focus on one week at a time.
5. Use the `<` and `>` buttons to move to the previous or next month or week, depending on the selected view.
6. Use `Today` to return to the current date in one click.
7. Select a date in the grid to view that date's events in the details area below the calendar.

## Add a New Event

1. Go to the `Event Editor` section below the calendar.
2. Enter the editor PIN and select `Unlock`.
3. Select the date you want to add the event to, either by clicking a date in the calendar or by using the `Date` field in the editor.
4. Enter the event name in `Event Name`.
5. Select an image with the `Image` file input.
6. Wait until the image preview appears and the status changes to `Image ready.`
7. Select `Save Event`.
8. Confirm the status changes to `Event saved. Export the JSON file to publish changes.`

The save button is disabled while the selected image is processing. If the image is still processing and save is attempted, wait for processing to finish before saving.

## Edit an Existing Event

1. Unlock the `Event Editor`.
2. Select the date that contains the event.
3. In the event details area, select `Edit` for the event you want to change.
4. Update the `Date`, `Event Name`, or `Image` fields.
5. If you replace the image, wait until the new preview appears and the status changes to `Image ready.`
6. Select `Save Event`.
7. Confirm the status changes to `Event saved. Export the JSON file to publish changes.`

## Delete an Event

1. Unlock the `Event Editor`.
2. Select the date that contains the event.
3. Select `Edit` for the event you want to remove.
4. Select `Delete`.
5. Confirm the status changes to `Event deleted. Export the JSON file to publish changes.`

## Export and Publish Changes

1. After adding, editing, or deleting events, select `Export events.json`.
2. Save the downloaded `events.json` file.
3. Replace the project file at `assets/data/events.json` with the exported file.
4. Deploy or publish the updated site files.
5. Reopen the site and confirm the calendar loads the updated events.

Calendar edits are made in the browser first. They do not update the static site until the exported `events.json` file replaces `assets/data/events.json` and the site is published again.

## Troubleshooting

| Message | What it means | What to do |
| --- | --- | --- |
| `Incorrect PIN.` | The editor PIN did not match. | Re-enter the maintainer PIN and select `Unlock`. |
| `Choose a valid date.` | The date field is empty or invalid. | Select a date from the calendar or use the `Date` field. |
| `Enter an event name.` | The event name field is empty. | Fill in `Event Name`. |
| `Choose an event image.` | A new event needs an image. | Select an image with the `Image` file input. |
| `Processing image.` | The selected image is being prepared for saving. | Wait for the preview and `Image ready.` status. |
| `Image could not be loaded.` | The selected image could not be read by the browser. | Try another image file. |
| `Calendar data could not be loaded.` | The page could not load `assets/data/events.json`. | Confirm the file exists, contains valid JSON, and is deployed with the site. |

