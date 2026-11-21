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
