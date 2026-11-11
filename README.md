# Product picker

Pick a product from your site's product catalog right in the CMS editor. Editors choose from a dropdown grouped by category, with each product's current rate, and the content stores only the product ID. The site renders the product's current name, rate and details from the same catalog, so a catalog change never needs a content edit.

Documentation: [walkthrough](https://opti.joshuaonwezen.dev/demo/cms-ui-extensions#product-picker).

## What editors get

A **Product picker** property editor on every property an admin binds it to:

- a dropdown of the catalog's products, grouped by category, each labelled with its rate (e.g. `1-Year Fixed Saver: 5.10% AER`);
- the picked product's rate details under the dropdown, and how many products the catalog has and when it was updated;
- a stored ID the catalog no longer lists is kept and flagged, so opening an item never wipes it;
- if the catalog can't be read (no site URL saved, or the site doesn't answer), a plain text field with the reason, so the property never gets stuck.

It works on shared blocks and on blocks placed inline in Visual Builder alike.

## Setup

1. Install the app on the CMS instance (see [Deploy](#deploy)). Each CMS instance gets its own install.
2. Save the site URL in the app settings. Saving checks that the site's catalog lists products.
3. **Bind it to a property:** Settings > Content Types > the type > the product property (a long string: a string with no format) > User Interface > **Editor: Product picker**. The CMS lists the editor only on long-string properties and mounts it only where it is picked. Do this on each CMS instance.

| Setting | Required | Where to find it | Used for |
|---|---|---|---|
| Site URL | Yes | Your site's address, e.g. `https://www.example.com` | The catalog is read from `<site URL>/api/catalog/products`. |

Using the extension on another CMS instance: [reuse](https://opti.joshuaonwezen.dev/demo/cms-ui-extensions#reuse). Something not working: [troubleshooting](https://opti.joshuaonwezen.dev/demo/cms-ui-extensions#troubleshooting).

## What your site needs

- **A catalog endpoint:** `GET <site URL>/api/catalog/products`, public (no authentication), answering JSON in this shape:

  ```json
  {
    "updatedAt": "2026-01-15",
    "products": [
      {
        "id": "fixed-saver-1y",
        "name": "1-Year Fixed Saver",
        "category": "savings",
        "rate": {"value": 5.1, "label": "AER", "basis": "fixed", "note": "Rate fixed for 12 months"}
      }
    ]
  }
  ```

  - `id` and `name` are required; products without them are skipped. `id` is what the content stores, so keep it stable.
  - `category` groups the dropdown. `savings`, `current-account`, `credit-card`, `mortgage`, `business` and `investment` get readable group names; anything else is grouped under "Other".
  - `rate` is optional. With a numeric `value` the label reads `<name>: <value to 2 decimals>% <label>`, and the details line adds `basis` and `note`.
  - `updatedAt` is shown to editors as is. Any other fields are ignored, so the same endpoint can carry everything the site needs.
- **A long-string property** on the content type to bind the editor to, holding the product ID. Keep it a plain string with no format.
- **Render the product from the same catalog**, looking it up by the stored ID, so the page always shows the current name and rate. Handle an ID the catalog no longer lists, for example by hiding the block.

## Limits

These come from the CMS UI extensions platform (beta, SDK 1.1.0):

- **The binding lives in the CMS only**, not in the content-type REST API, so pushing content types from code doesn't set it. Bind it by hand on each instance.
- **The editor isn't told which property it is on** (its settings are `{}`), and for a block placed inline in Visual Builder its content context is the page. The binding is the only way to target a field.
- **The catalog is cached for 5 minutes** by the app's backend, so a new product can take that long to appear in the dropdown.
- **Each bound property is its own iframe**, so the editor uses native controls and no component library to keep the bundle small.
- **`ocp dev` does not render property editors.** Test on a CMS instance after publishing.

## Security

- The app holds no credentials. Its backend only reads the catalog URL derived from the saved site URL, which must be a full `http(s)` URL.
- The content stores only the product ID; product details are never copied into the CMS.

## Develop

```bash
yarn install
yarn validate      # lint + typecheck + unit tests + build + ocp-app-sdk validate
```

There is no live test suite: publish a dev version and try it on a CMS instance.

## Deploy

With the OCP CLI (run it as `npx -p @optimizely/ocp-cli-v2 ocp ...` if it isn't installed):

```bash
npx -p @optimizely/ocp-cli-v2 ocp app register      # once
ocp app prepare --bump-dev-version --publish
ocp directory install cms_product_picker@<version> --scope <cms-instance-uuid>
```

Publishing a new dev version moves existing installs onto it.
