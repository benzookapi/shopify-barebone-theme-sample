# Breadcrumb Navigation in Shopify Themes

Custom Liquid implementation of breadcrumb navigation for Shopify themes (e.g. Dawn).
Shopify does not include breadcrumbs out of the box, so this guide covers how to build them using Liquid.

---

## Understanding Shopify's Structural Constraints

The reason breadcrumbs are limited to roughly 3 levels by default:

| Level | Available Object | Constraint |
|-------|-----------------|------------|
| Home | Fixed | None |
| Collection | `collection` object | A product can belong to multiple collections — which one is the "parent" is ambiguous |
| Product | `product` object | Parent collection is only known when accessed via a collection-scoped URL (using `within`) |
| Sub-collection | **Not natively supported** | Shopify has no sub-collection concept |

---

## Implementation Approaches

### Method A — Standard Collection Context (Simplest)

```
Home > [Collection] > Product
```

- Only shows a parent when the `collection` object exists on the page.
- Works automatically when the URL is `/collections/mens/products/shirt`.
- **Limit**: 3 levels maximum; which collection is shown depends on the URL.

### Method B — Navigation Menu Traversal (Recommended for 4–5 levels)

```
Home > Top Category > Sub Category > Product
```

- Create a dedicated menu in the Shopify admin (e.g. `breadcrumb-nav`) with a nested structure up to 4 levels.
- Traverse `linklists['breadcrumb-nav']` in Liquid using `link.active` and `link.child_active` to detect the current page.
- Because Liquid has no recursion, nesting is handled with explicit nested `for` loops up to a fixed depth.
- **Benefit**: Hierarchy can be changed from the Shopify admin without code changes.
- **Limit**: Maximum depth is hardcoded in the template (typically 3–4 levels).

Sample: [snippets/breadcrumbs-nav-menu.liquid](../snippets/breadcrumbs-nav-menu.liquid)

### Method C — Metafield Approach (Most flexible, suitable for deep hierarchies)

```
Home > Clothing > Women > Tops > Cut & Sew > Product
```

- Define a `custom.breadcrumb_path` metafield on products and collections (e.g. `Clothing|Women|Tops`).
- Define a matching `custom.breadcrumb_urls` metafield with the corresponding URLs (e.g. `/collections/clothing|/collections/women|/collections/tops`).
- In Liquid, `split: '|'` both values and loop to render each crumb.
- **Benefit**: Unlimited depth, fully customizable per product.
- **Tradeoff**: Metafield data must be entered and maintained for each product/collection.

Sample: [snippets/breadcrumbs-metafield.liquid](../snippets/breadcrumbs-metafield.liquid)

### Method D — Product Tags as Pseudo-Hierarchy (Reference only)

- Use tag naming conventions such as `cat:mens` and `subcat:shirts` and parse them in Liquid.
- Not recommended: tag count limits and parse complexity make this harder to maintain than Method C.

---

## Recommended Plan

Create `snippets/breadcrumbs.liquid` and `render` it from each page template.

### Phase 1 — Page-type-based breadcrumbs

| Page type | Breadcrumb |
|-----------|-----------|
| `home` | Hidden |
| `product` | Home > Collection (if present) > Product |
| `collection` | Home > Collection |
| `article` | Home > Blog > Article |
| `blog` | Home > Blog |
| `page` | Home > Page |
| `search` | Home > Search results |
| `404` | Home > 404 |

### Phase 2 — Deeper hierarchy (for marketplace-style sites)

- **Method B**: Create a `breadcrumb-nav` menu in Shopify admin with nested links, then traverse with Liquid nested loops.
- **Method C**: Add `custom.breadcrumb_path` and `custom.breadcrumb_urls` metafields to products/collections and split them in Liquid.

### Phase 3 — SEO

- Use semantic markup: `<nav aria-label="breadcrumb">` + `<ol>`.
- Inject `BreadcrumbList` JSON-LD structured data into `<head>`.
- Align with `canonical_url`.

---

## Deep Hierarchy for Marketplace-style Sites

For 5–6 level hierarchies, the best approach is **Method C (Metafields) + Metaobjects**:

1. Create a Metaobject definition named `category`:
   - `name` (single_line_text)
   - `parent` (reference → `category` Metaobject)

2. Build the full category tree in the Metaobjects editor in Shopify admin.

3. On each product, set a `custom.category` metafield referencing the deepest-level `category` Metaobject.

4. In Liquid, traverse the `parent` chain (one loop iteration per level) to build the full breadcrumb path.

This approach allows:
- Managing the category tree visually in the Shopify admin.
- Changing hierarchy without touching theme code.
- Supporting arbitrary depth as long as loop depth in Liquid covers it.

---

## Summary

| Use case | Recommended method |
|----------|--------------------|
| Simple store (up to 3 levels) | Method A — collection context |
| 4–5 levels, admin-manageable | Method B — navigation menu traversal |
| Per-product full customization | Method C — metafields |
| Marketplace-style deep hierarchy | Method C + Metaobjects |

---

## Adding Sections to Templates

Breadcrumbs are implemented as sections so they can be added and positioned without modifying existing theme files.

### Option 1 — Global (all pages via header group)

Use **Method B** if you want breadcrumbs to appear on every page automatically.

1. In the Shopify admin, go to **Online Store > Themes > Customize**.
2. In the theme editor, select the **Header** group in the left panel.
3. Click **Add section** and choose **Breadcrumbs (nav menu)**.
4. Set the **Menu handle** to match the navigation menu you created (default: `breadcrumb-nav`).

The section uses `"enabled_on": { "groups": ["header"] }`, so it is only available in the header section group.

### Option 2 — Per template (e.g. Collection only)

Use **Method C** if you want breadcrumbs only on specific pages and need per-product hierarchy control.

1. In the theme editor, select the target template in the top bar (e.g. **Collection**, **Product**).
2. Click **Add section** and choose **Breadcrumbs (metafield)**.
3. Position the section above the main content section by dragging in the left panel.

The section uses `"enabled_on": { "templates": ["collection", "product", "article", "page"] }`, so it appears only on those template types.

> You can add this section independently to Collection and Product templates, each at a different position in the layout.

## Setup Walkthrough

### Method B — Navigation Menu Traversal

#### Step 1: Create the navigation menu

1. In the Shopify admin, go to **Online Store > Navigation > Add menu**.
2. Set the menu name to `Breadcrumb Nav` — the handle will auto-fill as `breadcrumb-nav`.
3. Add items and nest them by dragging to build the category hierarchy. Example:

```
Mens             → /collections/mens
  ├ Tops         → /collections/mens-tops
  │   ├ T-shirts → /collections/mens-tshirts
  │   └ Shirts   → /collections/mens-shirts
  └ Bottoms      → /collections/mens-bottoms
Womens           → /collections/womens
  └ Tops         → /collections/womens-tops
```

> URLs must match actual collection URLs in your store. The snippet uses `link.active` to match the current URL automatically — no manual configuration per page needed.

#### Step 2: Add the section in the theme editor

1. **Online Store > Themes > Customize**.
2. Select the **Header** group in the left panel.
3. Click **Add section** → **Breadcrumbs (nav menu)**.
4. Leave **Menu handle** as `breadcrumb-nav` (or type your custom handle).

#### Step 3: Verify

Navigate to a collection that matches a menu URL (e.g. `/collections/mens-tshirts`).
The breadcrumb renders automatically:

```
Home / Mens / Tops / T-shirts
```

If the current URL does not match any menu link, only the page title is shown as a fallback.

---

### Method C — Metafield

#### Step 1: Create the metafield definitions

In **Settings > Custom data > Products**, click **Add definition** twice:

| | Field 1 | Field 2 |
|---|---|---|
| Name | Breadcrumb path | Breadcrumb URLs |
| Namespace & key | `custom.breadcrumb_path` | `custom.breadcrumb_urls` |
| Type | Single line text | Single line text |

Repeat the same definitions under **Collections** if you also want breadcrumbs on collection pages.

#### Step 2: Enter metafield values on a product

Open any product in the Shopify admin. Scroll to the **Metafields** section at the bottom and fill in:

| Field | Example value |
|-------|--------------|
| `custom.breadcrumb_path` | `Clothing\|Mens\|Tops` |
| `custom.breadcrumb_urls` | `/collections/clothing\|/collections/mens\|/collections/mens-tops` |

- Segments are separated by `|` (pipe).
- Order is shallowest → deepest ancestor. The current product title and URL are appended automatically.
- The number of segments in both fields must match.

#### Step 3: Add the section in the theme editor

1. In the theme editor, select the **Product** template from the top bar.
2. Click **Add section** → **Breadcrumbs (metafield)**.
3. Drag the section above the main product section in the left panel.

#### Step 4: Verify

Open the product page in the storefront:

```
Home / Clothing / Mens / Tops / [Product title]
```

Products without metafield values set will show only:

```
Home / [Product title]
```

---

## Files

| File | Description |
|------|-------------|
| [sections/breadcrumbs_nav_menu.liquid](../sections/breadcrumbs_nav_menu.liquid) | Method B section — add via header group in theme editor |
| [sections/breadcrumbs_metafield.liquid](../sections/breadcrumbs_metafield.liquid) | Method C section — add per template in theme editor |
| [snippets/breadcrumbs-nav-menu.liquid](../snippets/breadcrumbs-nav-menu.liquid) | Method B logic — navigation menu traversal (up to 4 levels) |
| [snippets/breadcrumbs-metafield.liquid](../snippets/breadcrumbs-metafield.liquid) | Method C logic — metafield-based breadcrumbs (unlimited depth) |

---

## References

- [Shopify Liquid: link object](https://shopify.dev/docs/api/liquid/objects/link)
- [Shopify Liquid: linklists object](https://shopify.dev/docs/api/liquid/objects/linklists)
- [Shopify Metafields](https://shopify.dev/docs/apps/custom-data/metafields)
- [Shopify Metaobjects](https://shopify.dev/docs/apps/custom-data/metaobjects)
- [Schema.org BreadcrumbList](https://schema.org/BreadcrumbList)
- [Dawn breadcrumb implementation reference](https://im-sosleepy.com/webproduction/breadcrumbs-in-dawn/)
