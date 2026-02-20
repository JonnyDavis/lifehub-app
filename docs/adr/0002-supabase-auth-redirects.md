# ADR 0002: Supabase auth redirect handling

## Context

Supabase email flows (signup confirmation, magic links, password reset) rely on redirect URLs.
This app includes a confirm route handler at `/auth/confirm` that verifies OTP tokens.

## Decision

Standardise auth email links to land on `/auth/confirm` (and then redirect to an in-app path).

## Notes

- Supabase dashboard must allow the redirect URL(s) under “Auth → URL configuration”.
- The app should validate the `next` path to prevent open redirects (allow relative paths and same-origin absolute URLs only).
