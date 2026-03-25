# Customer Filtered Storefront

Sections that show only products matching the logged-in customer's metafield value.

## Files

| File | Purpose |
|------|---------|
| [sections/customer_filtered_collection.liquid](../blob/main/sections/customer_filtered_collection.liquid) | Collection page — filtered product grid |
| [sections/customer_filtered_search.liquid](../blob/main/sections/customer_filtered_search.liquid) | Search page — filtered search form + results |
| [locales/en.default.json](../blob/main/locales/en.default.json) | Runtime translation keys |
| [locales/en.default.schema.json](../blob/main/locales/en.default.schema.json) | Theme editor label keys |

## Metafield Setup (Shopify Admin)

Create the following metafield definitions before using these sections.

### Customer metafield

| Field | Value |
|-------|-------|
| Namespace | `custom` |
| Key | `access_code` |
| Type | `single_line_text_field` |
| Description | Single access code assigned to the customer (e.g. `group-a`) |

### Product metafield

| Field | Value |
|-------|-------|
| Namespace | `custom` |
| Key | `access_codes` |
| Type | `list.single_line_text_field` |
| Description | List of access codes that can view this product (e.g. `["group-a", "group-b"]`) |

## Filter Logic

```
Customer login state
  └─ Not logged in       → Show login prompt + link
  └─ Logged in
       └─ access_code is blank  → Show "no access" message
       └─ access_code = "group-a"
            └─ product.access_codes contains "group-a"  → Render product
            └─ does not contain                          → Skip
```

See the implementation in:
- [sections/customer_filtered_collection.liquid](../blob/main/sections/customer_filtered_collection.liquid)
- [sections/customer_filtered_search.liquid](../blob/main/sections/customer_filtered_search.liquid)

## Adding Sections to Templates

Open the theme editor in Shopify Admin and add the sections to the appropriate templates.

| Template | Section to add |
|----------|---------------|
| Collection | **Filtered collection** |
| Search | **Customer filtered search** |

## Notes

- Filtering is done in Liquid after the collection/search results are loaded. Products that do not match are skipped at render time.
- The collection section iterates `collection.products` (up to 50 per page). If many products are excluded, visible products per page will be fewer than the page limit. Use the `paginate` tag to work around this for large catalogs.
- The search section passes `type=product` as a hidden input, so only products appear in results.
- Products with no `access_codes` metafield set are always hidden from filtered views.
