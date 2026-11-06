# Product picker: CMS UI extension

An Optimizely CMS (SaaS) UI extension, built as a CMS-scoped OCP app. It gives a long-string property you bind it to a **dropdown of bank products from the site's product catalog API**. The content stores only the product ID. The site (optimizely-nextjs-demo, `ProductSpotlightBlock`) renders the product's current name, rate and link from the same catalog, so a rate change never needs a content edit.

## Where the picker appears
The CMS offers a property editor in each matching property's settings, and mounts it only where it is chosen: **Settings → Content Types → (type) → (property) → User Interface → Editor: Product picker**. The manifest decides which properties offer it: `property_type: string` with no `property_format`, i.e. long strings. A shortString, boolean or choice property doesn't list it.

So a bound field is always the product dropdown. If the catalog can't be read (no site URL saved, or the site is down), it falls back to a plain text field with the reason, so the property never gets stuck. The editor gets no field name (`PropertyState.settings` is `{}`) and, for an inline Visual Builder element, `context.content` is the page, so the binding is the only way to target a field.

The binding lives in the CMS only (not in the content-type REST API), so it is set per instance, by hand.

Native `<select>`/`<textarea>` and no component library keep the bundle at ~220 KB, since an item can open dozens of these iframes.

## The catalog contract
`GET {siteUrl}/api/catalog/products` → `{updatedAt, products: [{id, name, category, rate: {value, label, basis, note?}, ...}]}`. The picker uses `id`, `name`, `category` and `rate`.

## Settings
**Product catalog**: the site URL. Saving checks that its catalog lists products. Until it is saved, a bound field is a plain text field that says why.

## Develop

```bash
yarn install
yarn validate      # lint + typecheck + unit tests + build + ocp-app-sdk validate
ocp app prepare --bump-dev-version --publish
ocp directory install cms_product_picker@<version> --scope <cms-instance-uuid>
```

`ocp dev` does not render property editors; test in a CMS instance after publishing.
