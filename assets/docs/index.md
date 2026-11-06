# Product picker

## Setup
1. **Product catalog**: the site URL whose `/api/catalog/products` lists the products, and
   optionally the content types that get the picker (default `ProductSpotlight`).
2. **CMS API client**: a client ID and secret (CMS → Settings → API Keys), used to read the open
   item's content type and draft.

## How it works
The CMS mounts property editors on every long-string property, without saying which one. The
catalog dropdown appears on a field that already holds a product, on a configured content type's
field (a shared block), and on an empty field of a page whose draft has a Product Spotlight element
with no product yet. In that last case a "Type text instead" link turns a field that isn't the
product field back into text. Everywhere else the field is a plain text field.
