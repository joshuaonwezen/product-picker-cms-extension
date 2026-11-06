# Product picker

## Setup
1. **Product catalog**: save the site URL whose `/api/catalog/products` lists the products.
2. **Bind it to a property**: Settings → Content Types → the type (e.g. Product Spotlight) → the
   product property (a long string) → User Interface → **Editor: Product picker**. Do this on each
   CMS instance.

## How it works
A bound property shows a dropdown of the catalog's products, grouped by category with each
product's rate, and stores the product ID. If the catalog can't be read, the property falls back to
a plain text field and says why.
