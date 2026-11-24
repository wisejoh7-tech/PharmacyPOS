# Delivery outcomes

- [x] Non-admin staff can add and edit pharmacy drugs and supermarket products, update their stock, and cannot add or change unit prices; the API preserves existing prices on staff writes and defaults staff-created items to zero price. Admins can set and change prices.
- [x] Staff registration and directory changes persist through linked Django accounts, expose the login username for editing, cache staff data locally, and queue supported offline create/update/delete actions for synchronization.
- [x] Local/offline database mode uses SQLite when `OFFLINE_MODE=true`; non-debug online mode requires PostgreSQL and rejects MySQL or SQLite URLs. Render remains the hosting target.
- [x] Pharmacy and supermarket inventory lists provide a separate out-of-stock filter and label zero-stock products distinctly.
- [x] Both POS receipts use the admin-configured business address and login-page logo; customer registration captures an optional address that appears on receipts.
- [ ] Configure Render's PostgreSQL `DATABASE_URL` and apply migration `0020_staff_user_link.py` after the user supplies/authorizes the hosted database operation; no live Render database has been accessed or changed.

- [ ] Sales attendants and sales reps open directly to Pharmacy POS after sign-in and can switch to Supermarket POS.
- [ ] Sales attendants and sales reps can access the dashboard and inventory, while price entry is hidden from their navigation/forms and rejected by the API.
- [ ] Both POS receipts include the signed-in attendant/sales representative name, item quantities, total, customer name, and customer phone number.
- [ ] Sales attendants, sales reps, and admins can register a new customer.
- [ ] The supplied logo replaces the logo on login and is used as the Windows Electron application icon after building.
- [ ] Staff identity is resolved for all supported login identifiers and sale creation uses the authenticated identity; backend changes are ready for deployment.
- [ ] Receipt printing works from a signed-in checkout for both POS types.
