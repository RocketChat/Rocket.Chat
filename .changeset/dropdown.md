---
"@rocket.chat/meteor": patch
---

feat: new dropdown multiselect on Rooms page

- Created a new multi-select dropdown component to add section titles and other features, as needed.
- This new component can be easily grouped with other dropdown instances, to create a complex multi-select filter.
- Created a new custom hook to filter rooms, using a Set object to store unique values inside an array, instead of creating a custom function to remove duplicates.
- Removed previous checkbox filters, and added two new multi-select dropdowns to the Admin Rooms page
