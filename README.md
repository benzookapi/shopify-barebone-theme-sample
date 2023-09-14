# Overview
This is an _unoffical_ sample code for scratch building [Shopify theme](https://shopify.dev/docs/themes) _without_ [cloning Dawn](https://github.com/Shopify/dawn) for understanding the [theme architecture](https://shopify.dev/docs/themes/architecture) with simpler and fewer [Liquid](https://shopify.dev/docs/api/liquid) code.

If you are a theme beginner and feel it tough to grab the high volume source code of Dawn, this basic theme may work as a tutorial, but you are expected to be familiar with basic HTML / JavaScript / CSS.

# Code structure
The exact same as the [Shopify theme structure](https://shopify.dev/docs/themes/architecture).

For better understanding of the theme mechanism, you should check these first. 

- [Layout](https://shopify.dev/docs/themes/architecture/layouts) = the theme main file
- [Templates](https://shopify.dev/docs/themes/architecture/templates) = each page configuration to render the sections below, most of which are **JSON** files (some are Liquid)
- [Sections](https://shopify.dev/docs/themes/architecture/sections) = each page content written by HTML / JavaScript / CSS with Liquid code, most of which are **Liquid** files (some are JSON)
- [Section schema](https://shopify.dev/docs/themes/architecture/sections/section-schema) = definitions of how each section works with the [theme editor](https://shopify.dev/docs/themes/tools/online-editor)
- [App blocks](https://shopify.dev/docs/themes/architecture/sections/app-blocks) = special blocks in each section to render [theme app extensions](https://shopify.dev/docs/apps/online-store/theme-app-extensions)
- [Dynamic sources](https://shopify.dev/docs/themes/architecture/settings/dynamic-sources) = theme editor function to connect store data instances to liquid objects

# How to run
Just for running this theme on your store, simply download this as a zip to upload to your store. However, most of this theme users must be developers who want to modify the code to apply the change immdiately, which can be done by [Shopify CLI](https://shopify.dev/docs/themes/tools/cli) with the following steps.

1. Install the CLI followging the steps in the page above (note that the CLI for theme is different from [the app CLI](https://shopify.dev/docs/apps/tools/cli) given as a npm module).

2. Clone this GitHub repo. or download as a ZIP to extract in your PC.

3. Go to the directory of this theme above to run [shopify theme dev](https://shopify.dev/docs/themes/tools/cli/commands#dev) in your terminal.

4. If you're asked to login, follow the steps and copy and paste the two URLs shown for theme editor and storefront to your browser URL box.

# How to install
The steps above are for development mode that gets terminated once you stop the running, if you install the theme to your store permanently, run [shopify theme push --unpublished](https://shopify.dev/docs/themes/tools/cli/commands#push) to create a new theme named by you in your store (For the second update, the `push` only without the parameter update the current theme).

# Sample list

# Trouble shooting 

# TIPS

# Disclaimer