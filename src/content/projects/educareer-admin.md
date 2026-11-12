---
title: EduCareer Admin
summary: Education & exam portal for schools — admin panel for students, exams, scholarships and student queries, built with Flutter Web on Firebase.
period:
  start: '2024'
tags: [flutter]
stack:
  - Flutter (Web)
  - Dart
  - Firebase Auth
  - Cloud Firestore
  - Firebase Storage
  - Firebase Hosting
  - Provider
  - RxDart
  - fl_chart
  - GitHub Actions
highlights:
  - Student, job-seeker and job-provider management
  - Student-query workflow — approve, reject, track status
  - Dashboards with charts, PDF export & printing
  - Firebase Hosting with GitHub Actions preview deploys
links:
  repo: https://github.com/Pankaj-MBM/educareer_admin_main
visibility: public
order: 9
cover: ../../assets/projects/educareer-admin.png
coverAlt: Illustrative UI mockup of the EduCareer admin dashboard — student and exam KPIs, upcoming exams and student queries.
illustration: true
---

## Overview

EduCareer is an education and exam portal for schools, and EduCareer Admin is its back-office. Admins manage students, job seekers and job providers, publish jobs and scholarships, and handle student queries — all in a **Flutter Web** app backed by **Firebase**.

## Key features

- **People & organizations** — add and list students, job seekers, job providers, companies and panelists.
- **Jobs** — job categories, new job postings and a combined job/student search.
- **Student-query workflow** — a query manager with approved and rejected queues and a status check.
- **Scholarships & exam corner** — dedicated admin pages.
- **Master data** — managed dropdown lists for designations, education levels, organizations, skill levels, subjects and teacher types.
- **Dashboards** — live counts plus line and bar charts built with `fl_chart`.
- **Documents** — PDF generation and printing; file and image uploads to Firebase Storage.
- **Secure access** — Firebase Authentication login.

## Tech & delivery

Flutter Web with **Provider** and **RxDart** for state, **Cloud Firestore** for data, **Firebase Storage** for files and **Firebase Hosting** for deployment — with a **GitHub Actions** workflow that publishes preview deployments for pull requests.
