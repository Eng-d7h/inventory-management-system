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
| currentStock | number | integer, changes only through transactions |
| minimumStock | number | integer |
| status | string | "active" or "inactive" |
| createdAt | Timestamp | |
| updatedAt | Timestamp | |

## inventoryTransactions

| Field | Type | Note |
|---|---|---|
| productId | string | |
| productName | string | copy of the name at the time of the transaction |
| type | string | "in" or "out" |
| quantity | number | positive integer |
| stockBefore | number | |
| stockAfter | number | |
| note | string | |
| createdBy | string | user uid |
| createdByName | string | user name at the time of the transaction |
| createdAt | Timestamp | |

## Relationships

```text
suppliers ──< products >── categories
                 │
                 └──< inventoryTransactions
```