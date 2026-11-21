# Data Model (Firestore)

## users
Document ID = `uid` from Firebase Auth.

| Field | Type | Note |
|---|---|---|
| name | string | |
| email | string | |
| role | string | "admin" for now |
| createdAt | Timestamp | |

## categories

| Field | Type | Note |
|---|---|---|
| name | string | |
| createdAt | Timestamp | |

## suppliers

| Field | Type | Note |
|---|---|---|
| companyName | string | required |
| contactPerson | string | required |
| email | string | required |
| phone | string | required |
| address | string | optional (empty string if not entered) |
| createdAt | Timestamp | |

The number of products per supplier is NOT stored. It is calculated from `products` using `supplierId`.

## products

| Field | Type | Note |
|---|---|---|
| name | string | |
| sku | string | unique |
| categoryId | string | document ID from `categories` |
| supplierId | string | document ID from `suppliers` |
| purchasePrice | number | 0 or more |
| sellingPrice | number | 0 or more |
| currentStock | number | integer, total of all warehouses, changes only through transactions |
| stockByWarehouse | map | `{ warehouseId: units }`, changes only through transactions |
| minimumStock | number | integer |
| status | string | "active" or "inactive" |
| createdAt | Timestamp | |
| updatedAt | Timestamp | |

## warehouses

| Field | Type | Note |
|---|---|---|
| name | string | unique (case-insensitive) |
| location | string | |
| capacity | number | integer > 0, max units |
| usedUnits | number | units stored now, updated by every stock movement |
| createdAt | Timestamp | |

## inventoryTransactions

| Field | Type | Note |
|---|---|---|
| productId | string | |
| productName | string | copy of the name at the time of the transaction |
| warehouseId | string | missing on movements made before warehouses existed |
| warehouseName | string | copy of the warehouse name |
| type | string | "in" or "out" |
| quantity | number | positive integer |
| stockBefore | number | product total (all warehouses) |
| stockAfter | number | product total (all warehouses) |
| note | string | |
| createdBy | string | user uid |
| createdByName | string | user name at the time of the transaction |
| createdAt | Timestamp | |

## Relationships

```text
suppliers ──< products >── categories
                 │
                 └──< inventoryTransactions >── warehouses
```