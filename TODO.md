# Delivery outcomes

- [x] Non-admin staff can add and edit pharmacy drugs and supermarket products, update their stock, and cannot add or change unit prices; the API preserves existing prices on staff writes and defaults staff-created items to zero price. Admins can set and change prices.
- [x] Staff registration and directory changes persist through linked Django accounts, expose the login username for editing, cache staff data locally, and queue supported offline create/update/delete actions for synchronization.
- [x] Local/offline database mode uses SQLite when `OFFLINE_MODE=true`; non-debug online mode requires PostgreSQL and rejects MySQL or SQLite URLs. Render remains the hosting target.
- [x] Pharmacy and supermarket inventory lists provide a separate out-of-stock filter and label zero-stock products distinctly.
- [x] Both POS receipts show the admin-configured business address near the login-page logo, not the customer's address; customer registration captures and saves an optional customer address in the profile.
- [x] Administrators can edit and delete customer records from the registry; the API rejects customer edits and deletions from non-admin users while preserving staff customer registration.
- [ ] Admins can maintain a nullable per-unit purchase cost for pharmacy drugs and supermarket products; non-admin inventory writes cannot set or change it, and non-admin inventory/sale responses do not reveal cost fields.
- [ ] New pharmacy and supermarket sale lines snapshot the product cost at checkout; historical sale lines without a snapshot stay explicitly uncosted and are never assigned a guessed zero cost.
- [ ] Sales Reports cover pharmacy and supermarket sales with date-range, sale-type, payment-method, staff, product, and text-search filters; the report shows transaction and line-item sales, refunds, net sales, sales trend, payment/staff/product breakdowns, and average transaction value.
- [ ] Admin sales reports calculate cost of goods sold, gross profit, gross margin, and cost coverage only from fully costed sales; historical or partially uncosted sales are visibly identified, and non-admin report responses omit cost/profit figures.
- [ ] Sales Reports export the currently filtered transactions and details to CSV and support a print-friendly layout that can be saved as PDF from the browser.
- [ ] Configure Render's PostgreSQL `DATABASE_URL` and apply migration `0020_staff_user_link.py` after the user supplies/authorizes the hosted database operation; no live Render database has been accessed or changed.

- [ ] Sales attendants and sales reps open directly to Pharmacy POS after sign-in and can switch to Supermarket POS.
- [ ] Sales attendants and sales reps can access the dashboard and inventory, while price entry is hidden from their navigation/forms and rejected by the API.
- [ ] Both POS receipts include the signed-in attendant/sales representative name, item quantities, total, customer name, and customer phone number.
- [ ] Sales attendants, sales reps, and admins can register a new customer.
- [ ] The supplied logo replaces the logo on login and is used as the Windows Electron application icon after building.
- [ ] Staff identity is resolved for all supported login identifiers and sale creation uses the authenticated identity; backend changes are ready for deployment.
- [ ] Receipt printing works from a signed-in checkout for both POS types.
- [ ] After an online first load, the browser/PWA application shell opens without internet; the installed Windows Electron application also opens its packaged local shell without internet.
- [ ] Pharmacy POS and Supermarket POS can both complete a sale from cached inventory while offline, immediately save a durable local sale/receipt snapshot, and print the receipt without depending on a live API request.
- [ ] Both offline sale types reserve cached local stock, use unique transaction IDs, and remain in the local sync queue until the hosted API acknowledges them; network errors and server validation failures retain the pending sale and its sync error instead of discarding it.
- [ ] When internet returns, both POS sale queues retry automatically; backend retries are idempotent, local sales are reconciled with server responses, and online sale/report totals reflect acknowledged sales without duplicate transactions or stock deductions.
- [ ] Offline receipt settings (including the admin-configured business name/address) and previously cached inventory are usable after an online first load; the UI identifies offline/pending state.
- [ ] Validate offline queue/database behavior and backend sale idempotency with tests/builds using temporary SQLite only; do not access or modify the live Render PostgreSQL database.
