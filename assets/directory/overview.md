# Product picker

Pick a product from your site's product catalog right in the CMS editor. The content stores the
product ID; the site renders the product's current name, rate and details from the same catalog, so
a catalog change never needs a content edit.

- **Product picker** property editor: a catalog dropdown, grouped by category, with each product's
  rate. Bind it to any long-string property in the content type's settings (User Interface >
  Editor); it works on shared blocks and inline Visual Builder elements alike.

Your site serves the catalog as JSON at `/api/catalog/products`.
