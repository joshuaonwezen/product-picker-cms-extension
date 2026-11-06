# Product picker: CMS UI extension

An Optimizely CMS (SaaS) UI extension, built as a CMS-scoped OCP app. It gives a long-string property a **dropdown of bank products from the site's product catalog API**. The content stores only the product ID. The site (optimizely-nextjs-demo, `ProductSpotlightBlock`) renders the product's current name, rate and link from the same catalog, so a rate change never needs a content edit.

## How it decides where the picker appears
- **The CMS mounts property editors on long strings only** (`string` with no format; `shortString` fields keep their own input), and on **every** long string. It does not tell the editor which property it is on.
- So the backend looks up the open item's content type (CMS REST `GET /v1/content/{key}`). On the content types named in settings (default `ProductSpotlight`, whose only long string is `productId`) the field is the product picker. Everywhere else it is a plain, auto-growing text field that saves like the CMS's own.
- The editor sends `PropertyState.settings` to the backend, which logs it once. The docs don't define it; if it names the property, fields could be targeted by name instead.

Native `<select>`/`<textarea>` and no component library keep the bundle at ~220 KB, since an item can open dozens of these iframes.

## The catalog contract
`GET {siteUrl}/api/catalog/products` → `{updatedAt, products: [{id, name, category, rate: {value, label, basis, note?}, ...}]}`. The picker uses `id`, `name`, `category` and `rate`.

## Settings
1. **Product catalog**: the site URL, and optionally the content types that get the picker.
2. **CMS API client**: client ID and secret, for the content-type lookup.

Until both are saved, every field stays a plain text field.

## Develop

```bash
yarn install
yarn validate      # lint + typecheck + unit tests + build + ocp-app-sdk validate
ocp app prepare --bump-dev-version --publish
ocp directory install cms_product_picker@<version> --scope <cms-instance-uuid>
```

`ocp dev` does not render property editors; test in a CMS instance after publishing.
