// app/graphql/queries.ts
export const ORDERS_WITH_LINES_QUERY = `#graphql
  query OrdersWithLines($first: Int!, $after: String) {
    orders(first: $first, after: $after, reverse: true, sortKey: CREATED_AT) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          name
          createdAt
          totalPriceSet { shopMoney { amount currencyCode } }
          lineItems(first: 100) {
            edges {
              node {
                id
                name
                sku
                quantity
                originalUnitPriceSet { shopMoney { amount } }
                discountedTotalSet { shopMoney { amount } }
              }
            }
          }
        }
      }
    }
  }
`;
