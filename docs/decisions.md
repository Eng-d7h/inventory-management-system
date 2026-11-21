# Project Decisions

## Data

1. **Stock source of truth:** `currentStock` is stored in the product document.
   It changes only through inventory transactions, inside a Firestore Transaction.
2. **Quantity is always positive:** the `type` field ("in" or "out") decides
   whether stock increases or decreases.
3. **Stock never goes negative:** Stock Out is rejected if quantity > currentStock.
4. **Stock status is not stored:** it is calculated from currentStock and minimumStock.
   - currentStock = 0 -> Out of Stock
   - currentStock <= minimumStock -> Low Stock
   - otherwise -> In Stock
5. **Denormalization:** inventoryTransactions stores `productName` and
   `createdByName` so the history stays correct and fast to display.

## Products

6. **No hard delete:** products are deactivated (`status: "inactive"`).
7. **Inactive products** are shown (faded) in the Products table,
   but hidden from the product list in Stock In / Stock Out.
8. **SKU must be unique.**
9. **Initial Stock:** available only when adding a product. If greater than 0,
   an "in" transaction with note "Initial stock" is created automatically.
10. **Selling price lower than purchase price:** show a warning only, do not block.

## Suppliers

11. **A supplier cannot be deleted if it has products.**
12. **Confirmation dialog** before any delete.

## Inventory

13. **Transactions are read-only:** no edit and no delete.
14. **Only "in" and "out" types** in the MVP.

## Security

15. **Security Rules from the start:** only signed-in users can read or write.
    Rules are tightened before deployment.

## UI

16. **Pages:** Login, Register, Dashboard, Products, Suppliers, Inventory (2 tabs).
17. **Sidebar:** Dashboard, Products, Suppliers, Inventory.
18. **Forms** open as modals over the page.
19. **Language:** English interface.

## Plan changes

20. **Suppliers before Products:** the Suppliers page is built before Products,
    so the product form has suppliers to choose from.
21. **Categories:** no separate page. A "Manage Categories" button on the
    Products page opens a modal to add and list categories.

## Warehouses

22. **Multiple warehouses:** each product stores `stockByWarehouse` (units per
    warehouse) and `currentStock` (the total). Both change only inside a
    Firestore Transaction, together with the warehouse `usedUnits` and the
    transaction record.
23. **Capacity:** Stock In is blocked when it would exceed the warehouse capacity.
    Status: >= 90% Full (red), >= 75% Almost Full (yellow), otherwise OK (green).
24. **Stock Out** is checked per warehouse (cannot remove more than that warehouse holds).
25. **Old products:** a one-time setup on the Inventory page assigns their stock
    to one warehouse.
26. **Delete warehouse:** only when it is empty (usedUnits = 0).
