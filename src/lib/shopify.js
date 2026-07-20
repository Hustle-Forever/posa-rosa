const domain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN
const token = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN
const endpoint = `https://${domain}/api/2024-01/graphql.json`

// Debug logging only in local dev builds — never in production
const DEBUG = import.meta.env.DEV

async function storefront(query, variables = {}) {
  if (DEBUG) {
    console.log('[Shopify] endpoint :', endpoint)
    console.log('[Shopify] token     :', token ? `${token.slice(0, 4)}...${token.slice(-4)}` : 'MISSING')
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  })

  const text = await res.text()
  if (DEBUG) {
    console.log('[Shopify] status    :', res.status, res.statusText)
    console.log('[Shopify] body      :', text)
  }

  let json
  try {
    json = JSON.parse(text)
  } catch (e) {
    console.error('[Shopify] JSON parse error:', e.message)
    throw new Error(`Shopify returned non-JSON (status ${res.status})`)
  }

  if (json.errors) {
    console.error('[Shopify] GraphQL errors:', json.errors)
    throw new Error(json.errors[0].message)
  }

  return json.data
}

export async function getProducts() {
  const data = await storefront(`
    {
      products(first: 100) {
        edges {
          node {
            id
            title
            handle
            description
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 5) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            collections(first: 5) {
              edges {
                node {
                  title
                  handle
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      }
    }
  `)
  return data.products.edges.map(e => e.node)
}

export async function getProductByHandle(handle) {
  const data = await storefront(
    `
    query getProduct($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        description
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 10) {
          edges {
            node {
              url
              altText
            }
          }
        }
        collections(first: 5) {
          edges {
            node {
              title
              handle
            }
          }
        }
      }
    }
  `,
    { handle }
  )
  return data.product
}

export async function getCollections() {
  const data = await storefront(`
    {
      collections(first: 50) {
        edges {
          node {
            id
            title
            handle
            description
            image {
              url
              altText
            }
          }
        }
      }
    }
  `)
  return data.collections.edges.map(e => e.node)
}

export async function getProductsByCollection(handle) {
  const data = await storefront(
    `
    query getCollectionProducts($handle: String!) {
      collection(handle: $handle) {
        products(first: 100) {
          edges {
            node {
              id
              title
              handle
              description
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 5) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              collections(first: 5) {
                edges {
                  node {
                    title
                    handle
                  }
                }
              }
              options {
                name
                values
              }
              variants(first: 50) {
                edges {
                  node {
                    id
                    title
                    priceV2 {
                      amount
                      currencyCode
                    }
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    `,
    { handle }
  )
  return data.collection?.products.edges.map(e => e.node) ?? []
}

export function normalizeProduct(node) {
  return {
    id: node.id,
    name: node.title,
    handle: node.handle,
    description: node.description,
    price: parseFloat(node.priceRange.minVariantPrice.amount),
    image: node.images.edges[0]?.node.url ?? '',
    collection: node.collections.edges[0]?.node.title ?? '',
    variantId: node.variants?.edges[0]?.node.id ?? null,
    variants: node.variants?.edges.map(e => ({
      id: e.node.id,
      title: e.node.title ?? '',
      price: e.node.priceV2 ? parseFloat(e.node.priceV2.amount) : parseFloat(node.priceRange.minVariantPrice.amount),
      options: e.node.selectedOptions ?? [],
    })) ?? [],
  }
}

export async function createShopifyCart(items) {
  const data = await storefront(
    `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
    `,
    {
      input: {
        lines: items.map(item => ({
          merchandiseId: item.variantId,
          quantity: item.quantity,
        })),
      },
    }
  )

  const { cart, userErrors } = data.cartCreate
  if (userErrors?.length > 0) throw new Error(userErrors[0].message)
  return cart.checkoutUrl
}
