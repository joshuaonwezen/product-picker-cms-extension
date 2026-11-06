# Product picker: CMS UI extension

An Optimizely CMS (SaaS) UI extension, built as a CMS-scoped OCP app. It gives a long-string property a **dropdown of bank products from the site's product catalog API**. The content stores only the product ID. The site (optimizely-nextjs-demo, `ProductSpotlightBlock`) renders the product's current name, rate and link from the same catalog, so a rate change never needs a content edit.

## How it decides where the picker appears
- **The CMS mounts property editors on long strings only** (`string` with no format). The SDK also accepts `property_format: shortstring`, but on joshCMS a shortstring entry never mounted, while the same editor without the format did. It mounts on **every** long string, and tells the editor neither which property it is on (`PropertyState.settings` arrives as `{}`) nor, for an inline Visual Builder element, which element: `context.content` is the **page** the element sits on.
- So the backend decides per field, in this order (`src/backend/lib/field.ts`):
  1. The field already holds a catalog product ID → picker.
  2. Any other filled field → plain text.
  3. The open item is one of the configured content types (default `ProductSpotlight`, whose only long string is `productId`), i.e. a shared block → picker.
  4. The open item's draft (CMS REST `GET /v1/content/{key}/versions/{version}`) holds an inline element of a configured type with no product yet → picker, with a **"Not the product field? Type text instead"** link. That last step is a best guess: another empty long string on the same page looks the same until the element has a product.
  5. Otherwise → plain text, an auto-growing text field that saves like the CMS's own.
- An empty text-mode field asks once more after 2.5 s, because a just-added element's fields can open before the CMS has saved it to the draft.
- The editor sends what the iframe gets (query string and hash with long values redacted, `window.name`, the content/property state keys, the extension definition), and the backend logs it once per container. If any of it ever names the field, the guess can become exact.

Native `<select>`/`<textarea>` and no component library keep the bundle at ~220 KB, since an item can open dozens of these iframes.

## The catalog contract
`GET {siteUrl}/api/catalog/products` → `{updatedAt, products: [{id, name, category, rate: {value, label, basis, note?}, ...}]}`. The picker uses `id`, `name`, `category` and `rate`.

## Settings
1. **Product catalog**: the site URL, and optionally the content types that get the picker.
2. **CMS API client**: client ID and secret, to read the open item's content type and draft.

Until both are saved, every field stays a plain text field.

## Develop

```bash
yarn install
yarn validate      # lint + typecheck + unit tests + build + ocp-app-sdk validate
ocp app prepare --bump-dev-version --publish
ocp directory install cms_product_picker@<version> --scope <cms-instance-uuid>
```

`ocp dev` does not render property editors; test in a CMS instance after publishing.
