# Product picker

## Setup
1. **Product catalog**: the site URL whose `/api/catalog/products` lists the products, and
   optionally the content types that get the picker (default `ProductSpotlight`).
2. **CMS API client**: a client ID and secret (CMS → Settings → API Keys), used to look up the open
   item's content type.

## How it works
The CMS mounts property editors on every long-string property, without saying which one. So the
editor looks up the open item's content type: on the configured types, whose only long string is the
product field, it shows the catalog dropdown; everywhere else it is a plain text field.
