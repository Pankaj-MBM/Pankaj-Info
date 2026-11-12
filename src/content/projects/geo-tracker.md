---
title: Geo Tracker
summary: Field-sales tracking on Google Maps — managers replay each sales employee's route by date, with an animated marker, speed controls and a timeline.
period:
  start: '2025-02'
tags: [angular, maps]
stack:
  - Angular 19 (standalone)
  - TypeScript
  - Google Maps (@angular/google-maps)
  - Angular Forms
highlights:
  - Date picker loads that day’s route
  - Animated marker moving along a polyline
  - Play / pause / reset and 2×–4× speed
  - Timeline slider to scrub the route
links:
  repo: https://github.com/Pankaj-MBM/GeoTrackerAngular
visibility: public
order: 4
featured: true
cover: ../../assets/projects/geo-tracker.png
coverAlt: Illustrative UI mockup of Geo Tracker — sales team list, route on a map with visit stops and playback controls.
illustration: true
---

## Overview

Geo Tracker helps managers track their **sales employees in the field** on **Google Maps**. Choose a date and the app draws that day’s path as a polyline, then animates a marker along it — useful for reviewing where a field agent travelled.

## Features

- **Date selection** loads the route recorded for that day.
- **Animated marker** that moves smoothly along the polyline.
- **Playback controls** — play, pause and reset, plus 2×, 3× and 4× speed.
- **Timeline slider** to jump to any point on the route.

## Tech

Built with **Angular 19** standalone components, the official `@angular/google-maps` package and template-driven forms. The public version runs on demo waypoints across Indian cities.
