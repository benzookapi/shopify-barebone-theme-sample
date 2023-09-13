# Overview
This is an _unoffical_ sample code for scratch building [Shopify theme](https://shopify.dev/docs/themes) _without_ [cloning Dawn](https://github.com/Shopify/dawn) for understanding the [theme architecture](https://shopify.dev/docs/themes/architecture) with simpler and fewer [Liquid](https://shopify.dev/docs/api/liquid) code.

If you are a theme beginner and feel it tough to grab the high volume source code of Dawn, this basic theme may work as a tutorial, but you are expected to be familiar with basic HTML / JavaScript / CSS.

# Code structure
The exact same as the [Shopify theme structure](https://shopify.dev/docs/themes/architecture)

For better understanding of the theme mechanism, you should check these first. 

- [Layout](https://shopify.dev/docs/themes/architecture/layouts) = the theme main file
- [Templates](https://shopify.dev/docs/themes/architecture/templates) = each page configuration to render the sections below, most of which are JSON files (some are Liquid)
- [Sections](https://shopify.dev/docs/themes/architecture/sections) = each page content written by HTML / JavaScript / CSS with Liquid code, most of which are Liquid files (some are JSON)
- [Section schema](https://shopify.dev/docs/themes/architecture/sections/section-schema) = definition of how each section works  with the [theme editor](https://shopify.dev/docs/themes/tools/online-editor)
- [App blocks](https://shopify.dev/docs/themes/architecture/sections/app-blocks) = Special blocks in each section to render [theme app extensions](https://shopify.dev/docs/apps/online-store/theme-app-extensions)
- [Dynamic sources](https://shopify.dev/docs/themes/architecture/settings/dynamic-sources) = The theme editor function to connect store data instances to liquid objects

# How to run

# How to install

# Sample list

# Trouble shooting 

# TIPS

# Disclaimer