# Project Tracker (React Native Assignment)

A small Project Tracker app built with React Native (Expo + TypeScript).  
Focus: clean architecture, correct async data flow, and reliable state handling (not visual polish).

## Features

### Project List Screen
- Displays project name, client name, and status
- Pull-to-refresh to re-fetch data
- Long project names are handled with ellipsis to avoid layout breaks
- Sort dropdown (Start date / Name / Status priority)
- Active filter indicator (Status / Search / Sort + Results count) with **Clear** button
- Favorite (★) projects to pin them to the top (persisted)
- Recently viewed section shown above the list (persisted)

### Filters & Search
- Filter by status (All / Active / On hold / Completed)
- Search by project name or client name
- Filters and search work together
- Original dataset remains intact (filtered list is derived, not mutated)

### Project Detail Screen
- View project details
- Update status (active / on_hold / completed)
- Edit fields (name, clientName, startDate, endDate, description) using **Edit → Save** in the header
- Cancel editing with a discard confirmation (unsaved changes are protected)
- `id` is not editable, and `status` is only editable via the status buttons
- Changes persist and update the list immediately

### Create Project
- Create a new project (defaults to **Active**)
- Validation for required fields and date format (YYYY-MM-DD)
- New projects persist and appear immediately in the list

### States & Edge Cases
- Loading state
- Empty list state
- No results state (after filter/search)
- API failure / invalid response handling
- No crashes / responsive UI

---

## Tech Stack
- Expo + React Native (TypeScript)
- React Navigation (Native Stack)
- AsyncStorage (for mock API persistence)

---

## Setup

### Requirements
- Node.js (LTS recommended)
- npm

### Install
```bash
npm install
npm i @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
npx expo install @react-native-async-storage/async-storage
```

### Run
Run the app using the command: `npx expo start`

```bash
npx expo start
```