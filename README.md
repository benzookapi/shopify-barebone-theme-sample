# Overview
This is an _unofficial_ sample code for scratch building [Shopify theme](https://shopify.dev/docs/storefronts/themes) _without_ [cloning Dawn](https://github.com/Shopify/dawn) for understanding the [theme architecture](https://shopify.dev/docs/storefronts/themes/architecture) with simpler and fewer [Liquid](https://shopify.dev/docs/api/liquid) code.

If you are a theme beginner and feel it tough to grab the high volume source code of Dawn, this basic theme may work as a tutorial, but you are expected to be familiar with basic HTML / JavaScript / CSS.

# Code structure
This sample follows the standard [Shopify theme structure](https://shopify.dev/docs/storefronts/themes/architecture).

Start with these core theme concepts:

| Concept | Where it lives in this repo | Role |
|---|---|---|
| [Layouts](https://shopify.dev/docs/storefronts/themes/architecture/layouts) | `layout/*.liquid` | Theme shell files. `layout/theme.liquid` wraps storefront pages and loads global assets. |
| [Templates](https://shopify.dev/docs/storefronts/themes/architecture/templates) | `templates/*.json`, `templates/*.liquid` | Page definitions that choose which sections render for each template type. Most templates are JSON; gift cards use Liquid. |
| [Sections](https://shopify.dev/docs/storefronts/themes/architecture/sections) | `sections/*.liquid`, `sections/*.json` | Merchant-configurable page modules written with HTML, JavaScript, CSS, and Liquid. JSON files here are section groups, not templates. |
| [Section blocks](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema#blocks) | Block schemas inside `sections/*.liquid` | Section-specific repeated content defined inside a section schema. |
| [Theme blocks](https://shopify.dev/docs/storefronts/themes/architecture/blocks) | `blocks/*.liquid` | Reusable UI components that sections render with `{% content_for 'blocks' %}` and allow with `{ "type": "@theme" }`. |
| [App blocks](https://shopify.dev/docs/storefronts/themes/architecture/sections/app-blocks) | Allowed from section schemas | Extension points for rendering [theme app extensions](https://shopify.dev/docs/apps/online-store/theme-app-extensions). |
| [Section groups](https://shopify.dev/docs/storefronts/themes/architecture/section-groups) | `sections/*_group*.json` | Persistent groups such as header and footer. They split the theme editor navigation and can support [contextual section groups](https://shopify.dev/docs/storefronts/themes/architecture/section-groups#contextual-section-groups). |
| [Dynamic sources](https://shopify.dev/docs/storefronts/themes/architecture/settings/dynamic-sources) | Theme editor setting connections | Theme editor feature for connecting store data instances to Liquid objects. |

Supporting folders in this sample:

| Folder | Purpose |
|---|---|
| `assets/` | Theme CSS, JavaScript, fonts, and other static assets. `.liquid` assets can use Liquid before Shopify serves them. |
| `config/` | Theme settings schema and saved setting data. |
| `docs/` | Feature setup guides for examples in this repo. |
| `locales/` | Translation files for storefront content and theme editor labels. |
| `snippets/` | Reusable Liquid partials included by layouts, sections, or blocks. |

This sample intentionally keeps some older section-local blocks so you can see the classic section/block model. It also includes theme block examples that are closer to current Horizon-style composition, where small reusable UI parts live under `/blocks` and sections decide where those blocks can be placed.

# How to run
Just for running this theme on your store, simply download this as a zip to upload to your store. However, most of this theme users must be developers who want to modify the code to apply the change immediately, which can be done by [Shopify CLI](https://shopify.dev/docs/storefronts/themes/tools/cli) with the following steps.

1. [Install the CLI](https://shopify.dev/docs/api/shopify-cli).

2. Clone this GitHub repo. or download as a ZIP to extract in your PC.

3. Go to the directory of this theme above to run [shopify theme dev](https://shopify.dev/docs/api/shopify-cli/theme/theme-dev) in your terminal.

4. If you're asked to login, follow the steps and copy and paste the two URLs shown on the CLI output for theme editor and storefront to your browser address bars.

# How to install
The steps above use a temporary development theme. To install the theme to your store permanently, run [shopify theme push --unpublished](https://shopify.dev/docs/api/shopify-cli/theme/theme-push) to create a new unpublished theme. For later updates, specify the target theme with `--theme <theme-id-or-name>` or choose the target from the CLI prompt. Use `shopify theme publish` only when you intentionally want to publish an uploaded theme as the live theme.

# Sample list
All samples are available at [Wiki](../../wiki).

# Common Implementation Examples

## Breadcrumb Navigation

Adds breadcrumb navigation to all page types via a single header group section.
Resolves hierarchy from Shopify standard taxonomy, a metafield, or a navigation menu — in that priority order.
JSON-LD `BreadcrumbList` structured data is injected automatically.

→ See [docs/breadcrumbs.md](docs/breadcrumbs.md) for setup instructions.

## Customer-Filtered Storefront

Restricts collection and search pages to show only products the logged-in customer is authorized to view, using an access code metafield on both the customer and product.

→ See [docs/customer-filtered-storefront.md](docs/customer-filtered-storefront.md) for setup instructions.

## Theme Blocks

Shows how reusable UI components under `/blocks` can be rendered by a section with `{% content_for 'blocks' %}`. This pattern is useful when you want Horizon-style composition: sections define layout regions, and theme blocks provide portable merchant-configurable UI pieces.

Examples in this repo:
- [sections/home_theme_blocks.liquid](sections/home_theme_blocks.liquid) renders theme blocks on the home page.
- [blocks/link_card.liquid](blocks/link_card.liquid), [blocks/collection_card.liquid](blocks/collection_card.liquid), and [blocks/product_card.liquid](blocks/product_card.liquid) are reusable link card blocks.
- [sections/product_inventory.liquid](sections/product_inventory.liquid) and [blocks/inventory_block.liquid](blocks/inventory_block.liquid) show a product-specific theme block section.

# Trouble shooting 
- If your changes to files are not applied to the theme editor or storefront, make sure the `dev` output of CLI shows `Synced` without errors. Even if you have no errors but the editor or storefront doesn't reflect the change, shut down the CLI with `Ctrl + C` to relaunch `shopify theme dev` (this sometimes happens when you modify the JSON template or section schema).

# TIPS
- Shopify Liquid has [the powerful internationalization features](https://shopify.dev/docs/storefronts/themes/markets/multiple-currencies-languages), and your liquid object doesn't need to change the code for translation and currencies.
For example, once you access the language path like `/ja` in your storefront URL, liquid objects return Japanese translated data such as product titles if they have the translation. Also once you pass the currency and country parameters like `currency=JPY&country=JP`, liquid objects return the price in the specified currency with country. 
   ```
     {{ product.title }} returns 'Test product' in `/` in English (when English is the default language), 
     does 'テスト商品' in `/ja` in Japanese without accepting any language parameters.

     {{ product.price | money_with_currency }} returns $5.00 USD after passing `currency=USD&country=US`,
     does ¥700 JPY with `currency=JPY&country=JP` without reading those parameters in code.
   ```
   If you want to check the behaviors above, try [the translation API](https://shopify.dev/docs/apps/markets/translate-content) or use [translation apps](https://apps.shopify.com/translate-and-adapt), and try [the local currency settings](https://help.shopify.com/en/manual/markets/pricing/set-up-local-currencies).
- This sample doesn't have [customer my page implementation](https://shopify.dev/docs/storefronts/themes/architecture/templates/customers-account) because it recommends to use [new customer accounts](https://help.shopify.com/en/manual/customers/customer-accounts/new-customer-accounts) which is not given by theme templates, but Shopify native features like other checkout extensibility.
- [Sections](https://shopify.dev/docs/storefronts/themes/architecture/sections) (`*.liquid`) do NOT need their corresponding [templates](https://shopify.dev/docs/storefronts/themes/architecture/templates) (`*.json`) always. For example, [the recommendation Ajax API](https://shopify.dev/docs/api/ajax/reference/product-recommendations) returns the result as the specified section without its template, and also you can render each section in JavaScript dynamically using [the section rendering API](https://shopify.dev/docs/api/section-rendering).
- If you create portable sections which can be inserted to all pages or specific ones, don't forget to add `presets` and `enabled_on` fields in the section schema. In this sample, every section can be inserted to a single template only (non portable) except for `list-collections.liquid` which is defined as a portal one for some specified templates in [its section schema](https://github.com/benzookapi/shopify-barebone-theme-sample/blob/main/sections/list-collections.liquid).
- Some global JavaScript objects like [window.Shopify](https://shopify.dev/docs/api/consent-tracking) are given by Shopify's generated code with [{{ content_for_header }}](https://shopify.dev/docs/storefronts/themes/architecture/layouts#content_for_header), and  global JS and CSS files are accessible with [the hosted file filters](https://shopify.dev/docs/api/liquid/filters/shopify_asset_url).
- [Gift card template](https://shopify.dev/docs/storefronts/themes/architecture/templates/gift-card-liquid) has the specific implementation with its own layout to work with checkout.
- [Templates](https://shopify.dev/docs/storefronts/themes/architecture/templates) used by the theme editor have naming rules to detect [each type](https://shopify.dev/docs/storefronts/themes/architecture/templates#template-types). For example, if you want to have multiple product templates, their names need to be `product.json` (default), `product.test1.json`, `product.test2.json`, .... etc. You can check it creating a new template from [the code editor](https://shopify.dev/docs/storefronts/themes/tools/code-editor).
- Note that if you connect your theme in the store to its GitHub repo., **Shopify bot automatically updates your GitHub code** which sometimes conflicts with your local change.

# Disclaimer
- This code is fully _unofficial_ and NOT guaranteed to pass [the public theme review](https://shopify.dev/docs/storefronts/themes/store/review-process/submit-theme) for Shopify theme store. The official requirements are described [here](https://shopify.dev/docs/storefronts/themes/store/requirements).
- If you use this code for your production, **all responsibilities are owned by you**.
