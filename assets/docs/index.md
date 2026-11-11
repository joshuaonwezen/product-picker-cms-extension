# Product picker

Pick a product from your site's product catalog right in the CMS editor. The content stores the product ID; the
site renders the product from the same catalog. Walkthrough: [Product picker extension](https://opti.joshuaonwezen.dev/demo/cms-ui-extensions#product-picker).

## Setup

1. **Product catalog**: save the site URL, e.g. `https://www.example.com`. The app reads the catalog from
   `<site URL>/api/catalog/products`, and saving checks that it lists products.
2. **Bind it to a property**: Settings > Content Types > the type > the product property (a long string: a string
   with no format) > User Interface > **Editor: Product picker**. Do this on each CMS instance: the binding is not
   part of the content type's definition, so pushing content types from code doesn't set it.

## How it works

A bound property shows a dropdown of the catalog's products, grouped by category with each product's rate, and
stores the product ID. If the catalog can't be read, the property falls back to a plain text field and says why.

## What your site needs

- `GET <site URL>/api/catalog/products`, public, answering
  `{updatedAt, products: [{id, name, category, rate: {value, label, basis, note}}]}`. `id` and `name` are
  required; `rate` is optional.
- Render the product by looking up the stored ID in the same catalog.

## Help

- Using the app on another CMS instance: [reuse](https://opti.joshuaonwezen.dev/demo/cms-ui-extensions#reuse).
- Something not working: [troubleshooting](https://opti.joshuaonwezen.dev/demo/cms-ui-extensions#troubleshooting).
