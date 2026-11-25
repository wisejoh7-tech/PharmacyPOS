# POS, role access, receipts, customers, and pharmacy branding

## Implementation approach

- Normalize authenticated staff identity on every supported JWT login path and expose the resolved staff record in the token response.
- Make sales attendants and sales reps land on Pharmacy POS after login, while keeping dashboard and inventory routes available; retain Pharmacy POS ↔ Supermarket POS switching.
- Allow sales attendants, sales reps, and admins to register customers, and allow POS checkout to attach a customer to both sale types.
- Add customer name and phone to pharmacy and supermarket receipts, including print-only receipt markup.
- Enforce role restrictions at the API: authenticated sales staff can sell and manage customers, but cannot create or change inventory prices; sale staff identity comes from the signed-in account rather than a trusted request field.
- Replace the login/brand mark and Electron Windows icon with the supplied pharmacy logo.

## Project structure

- `backend/api/`: Django models, serializers, permissions, viewsets, and migrations.
- `pharmacy/frontend/src/`: React routes, role-aware navigation, POS screens, customer registration, and branding.
- `pharmacy/public/` and `pharmacy/build/`: web favicon/logo and Electron Windows icon assets.

## Offline POS architecture

- Enable the existing Vite PWA plugin to precache the application shell and expose the app manifest so a browser-installed PWA can reopen after the first successful online load.
- Use the shared Dexie/IndexedDB database in both the browser and Electron renderer for cached pharmacy/supermarket catalogs, receipt settings, local sale records, and a durable FIFO sync queue. Checkout must finish and render/print its receipt from the saved sale snapshot without waiting for API or customer lookups.
- Generate high-entropy transaction IDs and make both Django sale-create endpoints idempotent using the existing unique transaction ID so an accepted request whose response was lost can be safely retried without creating a duplicate sale or stock deduction.
- On reconnection, retry queued pharmacy/supermarket sales in order, update each local record with server acknowledgement, preserve failures with an actionable error, and refresh cloud totals/catalog data on the next normal API reads.
- The existing `OFFLINE_MODE=true` Django configuration remains SQLite-capable. Electron currently packages only the frontend; this plan does not claim a bundled local Django server or a separate SQLite-to-cloud replication engine. The common POS offline transaction store for both browser and Electron is IndexedDB.

## Design decisions

- **Design movement:** Clean clinical retail workstation.
- **Core principles:** role clarity, fast checkout, readable receipts, and restrained pharmacy-green branding.
- **Color philosophy:** retain the existing emerald/blue operational palette and use the supplied green pharmacy mark as the brand anchor.
- **Layout paradigm:** compact operator panels with checkout always visible beside inventory.
- **Signature elements:** pharmacy logo mark, role-aware POS switcher, and receipt-first checkout confirmation.
- **Interaction philosophy:** default staff to the task they perform most often, with explicit switching rather than hidden state.
- **Animation:** preserve existing subtle fade/zoom transitions; avoid animation during printing.
- **Typography system:** retain the existing bold operator typography and monospace receipt typography.
- **Brand essence:** a practical pharmacy and retail counter system for fast, accountable transactions; clear, dependable, clinical.
- **Brand voice:** concise and operational, e.g. “Ready for the next sale.” and “Customer details saved to receipt.”
- **Wordmark & logo:** use the supplied pharmacy sign without redrawing it.
- **Signature brand color:** pharmacy green from the supplied mark.
