# Adding Products to Choice Gallery

Use `PRODUCT-TEMPLATE.json` as the starting point for every new product.

## Product workflow

1. Choose and verify the Amazon UK product and affiliate link.
2. Add the product image to the `images/` folder using a short, clear filename.
3. Copy the object from `PRODUCT-TEMPLATE.json` into `products.json`.
4. Replace all placeholder values with the real product details.
5. Set `publishedAt` to the date the product is added.
6. Keep `homepage` as `false` unless the product should appear in the curated Home view.
7. If `homepage` is `true`, assign a unique `homepageOrder` value for its Home position.
8. Test the image, search, category, filters, Home view, All Products view, and Amazon button before merging.
9. Commit changes on a feature branch and merge through a pull request.

## Safe defaults

```json
"order": 999,
"featured": true,
"homepage": false,
"homepageOrder": 999
```

These defaults prevent a newly copied template from accidentally taking priority on the storefront before it has been intentionally configured.
