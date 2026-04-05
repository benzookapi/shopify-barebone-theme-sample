#!/usr/bin/env node
/**
 * setup-breadcrumb-taxonomy.js
 *
 * Automates breadcrumb navigation setup for a Shopify store by:
 *   1. Scanning all products for their Shopify standard taxonomy categories
 *   2. Creating a smart (automated) collection for each unique category node
 *      — leaf nodes   : rule column PRODUCT_CATEGORY_ID
 *      — ancestor nodes: rule column PRODUCT_CATEGORY_ID_WITH_DESCENDANTS
 *   3. Creating or updating a navigation menu (handle: "breadcrumb-nav") with
 *      the full category hierarchy nested up to 3 levels (Shopify API limit)
 *
 * Each collection handle equals the taxonomy category ID (e.g. "hb-1-9-6"),
 * which lets the Liquid breadcrumbs snippet resolve titles via
 * collections[category.id] — no manual configuration per product needed.
 *
 * Requirements:
 *   Node.js 18+ (uses built-in fetch — no npm install needed)
 *   Admin API access token with scopes:
 *     read_products, write_products,
 *     read_online_store_navigation, write_online_store_navigation
 *
 * Usage:
 *   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com \
 *   SHOPIFY_ACCESS_TOKEN=shpat_xxxx \
 *   node docs/setup-breadcrumb-taxonomy.js
 *
 * Alternatively, edit the constants in the Configuration section below.
 *
 * The script is idempotent: existing collections and the menu are reused
 * (collections) or replaced (menu items) on subsequent runs.
 */

'use strict';

// ---------------------------------------------------------------------------
// Configuration — set via environment variables or edit the fallback values
// ---------------------------------------------------------------------------

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'YOUR_STORE.myshopify.com';
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN';
const API_VERSION  = '2025-01';

const MENU_HANDLE    = 'breadcrumb-nav';
const MENU_TITLE     = 'Breadcrumb Nav';
const MAX_MENU_DEPTH = 3; // Shopify navigation menu API hard limit

// Milliseconds to wait between mutation requests to avoid rate-limit errors.
const RATE_LIMIT_DELAY_MS = 300;

// ---------------------------------------------------------------------------
// GraphQL helper
// ---------------------------------------------------------------------------

const GQL_URL = `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

async function gql(query, variables = {}) {
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${await res.text()}`);
  }

  const { data, errors } = await res.json();
  if (errors?.length) {
    throw new Error(`GraphQL errors:\n${JSON.stringify(errors, null, 2)}`);
  }
  return data;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/**
 * Extracts the short category ID from a Shopify taxonomy GID.
 *   "gid://shopify/TaxonomyCategory/hb-1-9-6" → "hb-1-9-6"
 */
function gidToShortId(gid) {
  return gid.split('/').pop();
}

/**
 * Recursively prints the menu item tree for verification.
 */
function printTree(items, depth = 0) {
  const indent = '  '.repeat(depth + 1);
  for (const item of items) {
    console.log(`${indent}${item.title}`);
    if (item.items?.length > 0) printTree(item.items, depth + 1);
  }
}

// ---------------------------------------------------------------------------
// Step 1 — Collect all unique taxonomy category nodes from products
// ---------------------------------------------------------------------------

async function fetchCategories() {
  console.log('Step 1: Fetching product taxonomy categories...');

  /**
   * Map from short ID (e.g. "hb-1-9-6") to:
   *   { shortId, gid, name, parentShortId }
   */
  const categories = new Map();
  let cursor = null;
  let hasNextPage = true;
  let productCount = 0;

  while (hasNextPage) {
    const data = await gql(
      `query Products($cursor: String) {
         products(first: 250, after: $cursor) {
           pageInfo { hasNextPage endCursor }
           nodes {
             category {
               id
               name
               ancestors { id name }
             }
           }
         }
       }`,
      { cursor }
    );

    const { nodes, pageInfo } = data.products;
    productCount += nodes.length;

    for (const { category } of nodes) {
      if (!category) continue;

      // ancestors is ordered root → direct parent; category itself is the leaf
      const chain = [...category.ancestors, category];

      for (let i = 0; i < chain.length; i++) {
        const node = chain[i];
        const shortId = gidToShortId(node.id);

        if (!categories.has(shortId)) {
          categories.set(shortId, {
            shortId,
            gid: node.id,
            name: node.name,
            parentShortId: i > 0 ? gidToShortId(chain[i - 1].id) : null,
          });
        }
      }
    }

    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;
  }

  console.log(
    `  Scanned ${productCount} products → ${categories.size} unique category nodes\n`
  );
  return categories;
}

// ---------------------------------------------------------------------------
// Step 2 — Create smart collections for every category node
// ---------------------------------------------------------------------------

async function createCollections(categories) {
  console.log('Step 2: Creating smart collections...');

  // A node is non-leaf if any other node names it as its parent.
  const parentIds = new Set(
    [...categories.values()].map(c => c.parentShortId).filter(Boolean)
  );

  /** Map from shortId to collection GID (for building the menu later). */
  const collectionIds = new Map();
  let created = 0;
  let existed = 0;

  for (const cat of categories.values()) {
    // Check whether a collection with this handle already exists.
    const checkData = await gql(
      `query CheckCollection($handle: String!) {
         collectionByHandle(handle: $handle) { id title }
       }`,
      { handle: cat.shortId }
    );

    if (checkData.collectionByHandle) {
      collectionIds.set(cat.shortId, checkData.collectionByHandle.id);
      console.log(`  [exists]  ${cat.shortId} — ${cat.name}`);
      existed++;
    } else {
      // Ancestor nodes must use _WITH_DESCENDANTS so their collection
      // automatically includes products from all child categories.
      const isLeaf = !parentIds.has(cat.shortId);
      const column = isLeaf
        ? 'PRODUCT_CATEGORY_ID'
        : 'PRODUCT_CATEGORY_ID_WITH_DESCENDANTS';

      const createData = await gql(
        `mutation CreateCollection($input: CollectionInput!) {
           collectionCreate(input: $input) {
             collection { id handle title }
             userErrors { field message }
           }
         }`,
        {
          input: {
            title: cat.name,
            handle: cat.shortId,
            ruleSet: {
              appliedDisjunctively: false,
              rules: [{ column, relation: 'EQUALS', condition: cat.gid }],
            },
          },
        }
      );

      const { collection, userErrors } = createData.collectionCreate;
      if (userErrors.length > 0) {
        throw new Error(
          `Collection create failed for "${cat.shortId}": ${JSON.stringify(userErrors)}`
        );
      }

      collectionIds.set(cat.shortId, collection.id);
      console.log(`  [created] ${cat.shortId} — ${cat.name} (${column})`);
      created++;

      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  console.log(`\n  Result: ${created} created, ${existed} already existed\n`);
  return collectionIds;
}

// ---------------------------------------------------------------------------
// Step 3 — Build nested menu item tree (max MAX_MENU_DEPTH levels)
// ---------------------------------------------------------------------------

function buildMenuTree(categories, collectionIds) {
  console.log('Step 3: Building menu tree...');

  // Root nodes have no parent within the scanned category set.
  const roots = [...categories.values()].filter(
    c => !c.parentShortId || !categories.has(c.parentShortId)
  );

  const skipped = [];

  function buildItems(nodes, depth) {
    return nodes.map(cat => {
      const resourceId = collectionIds.get(cat.shortId);
      const item = { title: cat.name, type: 'COLLECTION', resourceId };

      const children = [...categories.values()].filter(
        c => c.parentShortId === cat.shortId
      );

      if (children.length > 0) {
        if (depth < MAX_MENU_DEPTH) {
          item.items = buildItems(children, depth + 1);
        } else {
          // Shopify menu API does not support nesting beyond MAX_MENU_DEPTH.
          // The Liquid breadcrumbs snippet still resolves these correctly via
          // Priority 1 (taxonomy) regardless of menu depth.
          skipped.push(...children);
        }
      }

      return item;
    });
  }

  const menuItems = buildItems(roots, 1);

  console.log('  Menu tree:');
  printTree(menuItems);

  if (skipped.length > 0) {
    console.log(
      `\n  Note: ${skipped.length} node(s) omitted — exceed ${MAX_MENU_DEPTH}-level menu limit` +
      ' (breadcrumb snippet still handles them via taxonomy):'
    );
    for (const s of skipped) {
      console.log(`    - ${s.shortId}: ${s.name}`);
    }
  }

  console.log();
  return menuItems;
}

// ---------------------------------------------------------------------------
// Step 4 — Create or update the breadcrumb-nav navigation menu
// ---------------------------------------------------------------------------

async function upsertMenu(menuItems) {
  console.log('Step 4: Creating / updating navigation menu...');

  const findData = await gql(
    `query FindMenu($handle: String!) {
       menu(handle: $handle) { id handle title }
     }`,
    { handle: MENU_HANDLE }
  );

  if (findData.menu) {
    const updateData = await gql(
      `mutation MenuUpdate(
         $id: ID!
         $title: String!
         $handle: String!
         $items: [MenuItemUpdateInput!]!
       ) {
         menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
           menu { id handle title }
           userErrors { field message }
         }
       }`,
      {
        id: findData.menu.id,
        title: MENU_TITLE,
        handle: MENU_HANDLE,
        items: menuItems,
      }
    );

    const { userErrors } = updateData.menuUpdate;
    if (userErrors.length > 0) {
      throw new Error(`Menu update failed: ${JSON.stringify(userErrors)}`);
    }
    console.log(`  Updated existing menu "${MENU_HANDLE}"\n`);
  } else {
    const createData = await gql(
      `mutation MenuCreate(
         $title: String!
         $handle: String!
         $items: [MenuItemCreateInput!]!
       ) {
         menuCreate(title: $title, handle: $handle, items: $items) {
           menu { id handle title }
           userErrors { field message }
         }
       }`,
      {
        title: MENU_TITLE,
        handle: MENU_HANDLE,
        items: menuItems,
      }
    );

    const { userErrors } = createData.menuCreate;
    if (userErrors.length > 0) {
      throw new Error(`Menu create failed: ${JSON.stringify(userErrors)}`);
    }
    console.log(`  Created menu "${MENU_HANDLE}"\n`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (
    STORE_DOMAIN === 'YOUR_STORE.myshopify.com' ||
    ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN'
  ) {
    console.error(
      'Error: credentials not configured.\n\n' +
      'Set environment variables before running:\n\n' +
      '  SHOPIFY_STORE_DOMAIN=your-store.myshopify.com \\\n' +
      '  SHOPIFY_ACCESS_TOKEN=shpat_xxxx \\\n' +
      '  node docs/setup-breadcrumb-taxonomy.js\n'
    );
    process.exit(1);
  }

  console.log(`Store : ${STORE_DOMAIN}`);
  console.log(`API   : ${API_VERSION}\n`);

  const categories = await fetchCategories();

  if (categories.size === 0) {
    console.log('No taxonomy categories found on any product. Assign standard taxonomy');
    console.log('categories to your products in Shopify admin, then re-run this script.');
    return;
  }

  const collectionIds = await createCollections(categories);
  const menuItems     = buildMenuTree(categories, collectionIds);

  await upsertMenu(menuItems);

  console.log('Done.');
}

main().catch(err => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
