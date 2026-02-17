# Project Tracker (React Native Assignment)

A small Project Tracker app built with React Native (Expo + TypeScript).  
Focus: clean architecture, correct async data flow, and reliable state handling (not visual polish).

## Features

### Project List Screen
- Displays project name, client name, and status
- Pull-to-refresh to re-fetch data
- Long project names are handled with ellipsis to avoid layout breaks

### Filters & Search
- Filter by status (All / Active / On hold / Completed)
- Search by project name or client name
- Filters and search work together
- Original dataset remains intact (filtered list is derived)

### Project Detail Screen
- View project details
- Update status (active / on_hold / completed)
- Edit fields (name, clientName, startDate, endDate, description) using **Edit → Save** button in the header
- `id` is not editable, and `status` is only editable via the status buttons
- Changes persist and update the list immediately

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