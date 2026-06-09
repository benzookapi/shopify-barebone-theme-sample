# Breadcrumb Navigation in Shopify Themes

Custom Liquid implementation of breadcrumb navigation for Shopify themes (e.g. Dawn).
Shopify does not include breadcrumbs out of the box, so this guide covers how to build them using Liquid.

**Demo:** [Wiki — Breadcrumb menu with collections, product categories, and metafields](../../../wiki#breadcrumb-menu-with-collections-product-categories-and-metafields)

---

## Understanding Shopify's Structural Constraints

The reason breadcrumbs are non-trivial in Shopify:

| Level | Available Object | Constraint |
|-------|-----------------|------------|
| Home | Fixed | None |
| Collection | `collection` object | A product can belong to multiple collections — which one is the "parent" is ambiguous |
| Product | `product` object | Parent collection is only known when accessed via a collection-scoped URL (using `within`) |
| Sub-collection | **Not natively supported** | Shopify has no sub-collection concept |

---

## Implementation

A single snippet and section cover all page types and all resolution strategies.

### Files

| File | Description |
|------|-------------|
| [sections/breadcrumbs.liquid](../sections/breadcrumbs.liquid) | Section — add via header group in the theme editor |
| [snippets/breadcrumbs.liquid](../snippets/breadcrumbs.liquid) | Logic — all page types, all resolution priorities |

### How it works

The section is placed once in the **header group** and handles every page type automatically.

#### Home page

Renders nothing.

#### Product pages — resolution priority order

| Priority | Condition | How ancestors are resolved |
|----------|-----------|---------------------------|
| 1 | `product.category` is set (Shopify standard taxonomy) | `product.category.ancestors` → `collections[category.id]` |
| 2 | `custom.breadcrumb_collections` metafield is set | Pipe-separated collection handles → `collections[handle]` |
| 3 | Neither | Navigation menu traversal (see below) |

Priority 1 only activates when at least one collection whose handle matches a taxonomy category ID is found. If no match is found, the snippet falls through to Priority 2, then Priority 3.

#### All other pages (collection, blog, article, page, search, 404)

Traverses the navigation menu specified by the **Menu handle** setting (default: `breadcrumb-nav`), up to 4 levels deep. If the current page is not in the menu, `page_title` is used as the current crumb — no manual configuration needed.

#### Structured data

JSON-LD `BreadcrumbList` is injected automatically on every page where breadcrumbs render.

---

## Setup

### Step 1: Add the section in the theme editor

1. **Online Store > Themes > Customize**.
2. Select the **Header** group in the left panel.
3. Click **Add section** → **Breadcrumbs**.
4. Leave **Menu handle** as `breadcrumb-nav` (or enter your custom handle).

---

### Step 2: Create a navigation menu (required for non-product pages)

1. In **Online Store > Navigation > Add menu**.
2. Set the name to `Breadcrumb Nav` — the handle auto-fills as `breadcrumb-nav`.
3. Add items and nest them by dragging to mirror your category hierarchy. Example:

```
Mens             → /collections/mens
  ├ Tops         → /collections/mens-tops
  │   ├ T-shirts → /collections/mens-tshirts
  │   └ Shirts   → /collections/mens-shirts
  └ Bottoms      → /collections/mens-bottoms
Womens           → /collections/womens
  └ Tops         → /collections/womens-tops
```

URLs must match actual collection URLs in your store. The snippet uses `link.active` and `link.child_active` to detect the current page automatically — no manual configuration per page needed.

#### Why the menu hierarchy is required

For collection, blog, article, page, search, and fallback product breadcrumbs, the snippet does not infer parent-child relationships from URLs. Shopify collections and pages do not have native parent collections or parent pages, so the breadcrumb hierarchy must come from a navigation menu.

The snippet traverses the configured menu and uses `link.active` / `link.child_active` to detect the current page and its ancestors. This means the menu links must point to the same storefront URLs as the pages being rendered, and the nesting in the menu must mirror the intended breadcrumb hierarchy.

If the current page is not present in the menu, or if the URL does not match, Liquid cannot detect its ancestors. In that case, the breadcrumb gracefully falls back to the current `page_title`, producing a shallow trail such as:

```text
Home > [Current page title]
```

> You can use Shopify Sidekick or the Admin GraphQL API to generate this menu automatically from your taxonomy category hierarchy. See the Sidekick prompt below.

---

### Step 3 (Priority 1, optional): Use Shopify standard taxonomy for product pages

If your products have a Shopify standard taxonomy category set, breadcrumbs resolve fully automatically — no metafield input needed.

**Requirement:** collection handles must equal the taxonomy category IDs exactly.

| Taxonomy category | Category ID | Collection handle to create |
|-------------------|-------------|----------------------------|
| Health & Beauty | `hb-1` | `hb-1` |
| Vitamins & Supplements | `hb-1-9` | `hb-1-9` |
| Multivitamins | `hb-1-9-6` | `hb-1-9-6` |

#### Why matching collections are required

`product.category` exposes the Shopify standard taxonomy category assigned to the product, including its ancestor category objects. These category objects are useful for hierarchy, but they are not storefront collection pages by themselves.

Breadcrumb items need clickable labels and URLs. For taxonomy-based product breadcrumbs, the snippet resolves each category node by looking up a collection whose handle matches the category ID:

```liquid
{% assign anc_col = collections[ancestor.id] %}
{% assign leaf_col = collections[cat.id] %}
```

Because of that lookup, each taxonomy category that should appear in the breadcrumb must have a matching collection. For example, category ID `hb-1-9-6` must have a collection with handle `hb-1-9-6`.

If a matching collection does not exist, that category level is skipped because Liquid has no collection title or collection URL to render. If none of the taxonomy categories resolve to collections, Priority 1 is not used and the snippet falls through to the metafield-based or navigation-menu fallback.

For smart (automated) collections, use these rule types:

| Collection type | Rule column | Effect |
|---|---|---|
| Leaf category (no children) | `PRODUCT_CATEGORY_ID` | Matches products assigned directly to this category |
| Ancestor category (has children) | `PRODUCT_CATEGORY_ID_WITH_DESCENDANTS` | Matches products in this category and all descendants |

> You can use Shopify Sidekick or the Admin GraphQL API to generate these collections and their rules automatically. See the Sidekick prompt below.

**How it works in Liquid:**
- `product.category.ancestors` returns the full ancestor chain (root → direct parent), each with an `id` like `hb-1-9-6`.
- `product.category` is the leaf node assigned directly to the product.
- The snippet looks up `collections[category.id]` for each node to get its title and URL.

---

### Step 4 (Priority 2, optional): Set a metafield for custom collection hierarchies

For products using custom collection handles (not matching taxonomy IDs), set the `custom.breadcrumb_collections` metafield.

1. In **Settings > Custom data > Products**, click **Add definition**:

   | Field | Value |
   |-------|-------|
   | Name | Breadcrumb collections |
   | Namespace & key | `custom.breadcrumb_collections` |
   | Type | Single line text |

2. Open a product and scroll to **Metafields**:

   | Field | Example value |
   |-------|--------------|
   | `custom.breadcrumb_collections` | `mens\|mens-tops\|mens-tshirts` |

   - Values are pipe-separated collection **handles** (not titles or URLs).
   - Order is shallowest → deepest ancestor. The current product title is appended automatically.
   - Titles and URLs are resolved from the handle — no separate URL field needed.

---

### Verify

| Page | Priority used | Expected breadcrumb |
|------|--------------|---------------------|
| Home | — | (nothing rendered) |
| Product with taxonomy category `hb-1-9-6` | 1 | `Home / Health & Beauty / Vitamins & Supplements / Multivitamins / [Product title]` |
| Product with metafield `mens\|mens-tops\|mens-tshirts` | 2 | `Home / Mens / Tops / T-shirts / [Product title]` |
| Product with neither (in menu) | 3 | `Home / [ancestor from menu] / [Product title]` |
| Product with neither (not in menu) | 3 | `Home / [Product title]` |
| `/collections/mens-tops` (in menu) | 3 | `Home / Mens / Tops` |
| Article page | 3 | `Home / [Blog name] / [Article title]` |
| Static page (not in menu) | 3 | `Home / [Page title]` |

---

## Automating Setup with Shopify Sidekick

Use the following prompt in Shopify Sidekick to automatically create smart collections and the breadcrumb navigation menu from your product taxonomy categories.

```
Create a Shopify app that automates breadcrumb navigation setup for a store.

The app should perform the following operations when triggered by the merchant
from the app's main page:

1. Fetch all products and extract their taxonomy categories, including the full
   ancestor chain for each category. Build a deduplicated list of all unique
   category nodes (id, gid, name, parent id, leaf or non-leaf).

2. For each unique category node, create a smart (automated) collection if one
   with a handle equal to the category id does not already exist:
   - Title  : category name as-is
   - Handle : category id exactly as-is (e.g. "hb-1-9-6"), never modified
   - Rule   : for leaf nodes use PRODUCT_CATEGORY_ID = category GID;
              for non-leaf nodes use PRODUCT_CATEGORY_ID_WITH_DESCENDANTS = category GID

3. Create or update a navigation menu with handle "breadcrumb-nav" and title
   "Breadcrumb Nav". Build a nested tree from the category hierarchy (max 3
   levels deep, as required by the API). Each menu item links to its
   corresponding collection using resourceId and type COLLECTION.

4. Display a results summary in the app UI showing:
   - Collections created vs. already existed
   - Menu created or updated
   - Full menu tree (title → children)
   - Any categories skipped due to the 3-level nesting limit
```

> The navigation menu API supports a maximum of 3 nesting levels. If your taxonomy is deeper than 3 levels, the menu is truncated at 3 levels. The Liquid breadcrumb snippet handles deeper hierarchies correctly via Priority 1 (taxonomy) regardless of menu depth.

### Alternative: Node.js script (no Sidekick required)

For development stores or any environment where Shopify Sidekick is not available, use the included Node.js script instead. It performs the same four operations (fetch categories, create smart collections, build menu tree, create/update menu) directly against the Admin GraphQL API.

**Requirements:** Node.js 18+, Admin API access token with scopes `read_products`, `write_products`, `read_online_store_navigation`, `write_online_store_navigation`.

```bash
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com \
SHOPIFY_ACCESS_TOKEN=shpat_xxxx \
node docs/setup-breadcrumb-taxonomy.js
```

The script is idempotent — safe to re-run. Existing collections are reused; the menu is updated in place.

→ See [setup-breadcrumb-taxonomy.js](setup-breadcrumb-taxonomy.js) for the full source.

---

## Deep Hierarchy for Marketplace-style Sites

For 5–6 level hierarchies beyond what the standard taxonomy supports, consider **Metaobjects**:

1. Create a Metaobject definition named `category`:
   - `name` (single_line_text)
   - `parent` (reference → `category` Metaobject)

2. Build the full category tree in the Metaobjects editor in Shopify admin.

3. On each product, set a `custom.category` metafield referencing the deepest-level `category` Metaobject.

4. In Liquid, traverse the `parent` chain (one loop iteration per level) to build the full breadcrumb path.

---

## Advanced: Semantic Blog and Article Breadcrumbs Independent from URLs

For WordPress-to-Shopify blog migrations, breadcrumbs sometimes need to preserve a deep semantic hierarchy that is independent from the Shopify URL structure. In that case, keep the UI breadcrumbs and the JSON-LD `BreadcrumbList` driven by the same normalized breadcrumb data.

The balanced approach is to use `blog.custom.breadcrumb_node` as the default source of truth, with `blog.custom.breadcrumb_path` available as an override for exceptional cases.

### Data model

Create a `breadcrumb_node` Metaobject for centrally managed hierarchy nodes:

| Field | Type | Purpose |
|---|---|---|
| `title` | Single line text | Breadcrumb label |
| `url` | URL | Breadcrumb link target |
| `parent` | Metaobject reference to `breadcrumb_node` | Parent semantic node |

Create a `breadcrumb_item` Metaobject only if fixed path overrides are needed:

| Field | Type | Purpose |
|---|---|---|
| `title` | Single line text | Breadcrumb label |
| `url` | URL | Breadcrumb link target |

Add these metafields where needed:

| Owner | Metafield | Type | Purpose |
|---|---|---|---|
| Blog or article | `custom.breadcrumb_node` | Metaobject reference to `breadcrumb_node` | Default semantic node |
| Blog or article | `custom.breadcrumb_path` | List of Metaobject references to `breadcrumb_item` | Ordered fixed breadcrumb override |

### Recommended default: `blog.custom.breadcrumb_node`

Use a `metaobject_reference` metafield that points to the deepest semantic node for the blog.

Example value:

| Owner | Metafield | Value |
|---|---|---|
| Blog: `migration-guides` | `custom.breadcrumb_node` | `breadcrumb_node: wordpress-migration` |

Example `breadcrumb_node` Metaobjects:

| Metaobject handle | Title | URL | Parent |
|---|---|---|---|
| `guides` | Guides | `/pages/guides` | — |
| `shopify-migration` | Shopify Migration | `/collections/shopify-migration` | `guides` |
| `wordpress-migration` | WordPress Migration | `/pages/wordpress-migration` | `shopify-migration` |

Article breadcrumbs can then be resolved by traversing the node's parent chain and appending the blog and article:

```text
Home > Guides > Shopify Migration > WordPress Migration > [Blog title] > [Article title]
```

This works well when the same semantic node needs to be reused across blogs, pages, collections, or products. The hierarchy is centrally managed in Metaobjects, while each resource only points to its own deepest semantic node.

### Optional override: `blog.custom.breadcrumb_path`

Use a `list.metaobject_reference` metafield when a blog needs a fixed breadcrumb path that should not be derived from parent traversal.

Example value:

| Owner | Metafield | Value |
|---|---|---|
| Blog: `migration-guides` | `custom.breadcrumb_path` | `breadcrumb_item: guides`, `breadcrumb_item: shopify-migration`, `breadcrumb_item: wordpress-migration` |

Each `breadcrumb_item` Metaobject stores the already-resolved breadcrumb label and URL:

| Metaobject handle | Title | URL |
|---|---|---|
| `guides` | Guides | `/pages/guides` |
| `shopify-migration` | Shopify Migration | `/collections/shopify-migration` |
| `wordpress-migration` | WordPress Migration | `/pages/wordpress-migration` |

The path field is easier to render because it is already ordered, but it duplicates hierarchy data. Use it as an override, not as the primary model, when the store needs a one-off editorial breadcrumb trail.

### Article-level overrides

Most articles should inherit the blog-level breadcrumb source. For special articles, add the same metafields to articles and resolve them before the blog-level values:

1. `article.custom.breadcrumb_path`
2. `article.custom.breadcrumb_node`
3. `blog.custom.breadcrumb_path`
4. `blog.custom.breadcrumb_node`
5. Navigation menu fallback
6. `Home > [Blog title] > [Article title]`

Whichever source is selected, normalize it into a single breadcrumb array first, then render both the visible UI and JSON-LD from that same array.

---

## References

- [Shopify Liquid: taxonomy_category object](https://shopify.dev/docs/api/liquid/objects/taxonomy_category)
- [Shopify Liquid: link object](https://shopify.dev/docs/api/liquid/objects/link)
- [Shopify Liquid: linklists object](https://shopify.dev/docs/api/liquid/objects/linklists)
- [Shopify Metafields](https://shopify.dev/docs/apps/custom-data/metafields)
- [Shopify Metaobjects](https://shopify.dev/docs/apps/custom-data/metaobjects)
- [CollectionRuleColumn: PRODUCT_CATEGORY_ID_WITH_DESCENDANTS](https://shopify.dev/changelog/introducing-productcategoryidwithdescendants-in-collectionrulecolumn-for-smart-collections)
- [Schema.org BreadcrumbList](https://schema.org/BreadcrumbList)
- [Google Search Central: Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
