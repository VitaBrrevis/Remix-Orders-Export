// app/routes/app.orders.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page, Card, IndexTable, useIndexResourceState, Button,
  Text, Box, InlineStack, InlineGrid, Banner
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { ORDERS_WITH_LINES_QUERY } from "../graphql/queries";

function csvEscape(v: unknown) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function fmtUTC(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getUTCFullYear();
  const mm   = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd   = String(d.getUTCDate()).padStart(2, "0");
  const hh   = String(d.getUTCHours()).padStart(2, "0");
  const mi   = String(d.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi} UTC`;
}
function toNum(amount?: string | null): number | undefined {
  if (amount == null) return undefined;
  const n = parseFloat(String(amount));
  return Number.isFinite(n) ? n : undefined;
}
function num(n?: number): string {
  return typeof n === "number" && Number.isFinite(n) ? n.toFixed(2) : "";
}

type MoneySet = { shopMoney: { amount: string; currencyCode?: string } };
type LineItemNode = {
  id: string;
  name?: string | null;
  sku?: string | null;
  quantity: number;
  originalUnitPriceSet?: MoneySet | null;
  discountedTotalSet?: MoneySet | null;
};
type OrderNode = {
  id: string;
  name: string;
  createdAt: string;
  totalPriceSet?: MoneySet | null;
  lineItems: { edges: Array<{ node: LineItemNode }> };
};
type OrdersConnection = {
  pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  edges: Array<{ node: OrderNode }>;
};
type LoaderOk = { ok: true; data: OrdersConnection };
type LoaderFail = { ok: false; message: string; pcdDenied?: boolean };
type LoaderOut = LoaderOk | LoaderFail;

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const after = url.searchParams.get("after");
  const first = Number(url.searchParams.get("first") ?? 25);

  try {
    const res = await admin.graphql(ORDERS_WITH_LINES_QUERY, { variables: { first, after } });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status} ${res.statusText}\n${body}`);
    }
    const jsonRes = await res.json();
    const orders: OrdersConnection =
      jsonRes?.data?.orders ?? { pageInfo: { hasNextPage: false, endCursor: null }, edges: [] };
    return json<LoaderOut>({ ok: true, data: orders });
  } catch (e: any) {
    const msg = String(e?.message || e);
    const pcdDenied =
      /not approved to access the Order object/i.test(msg) ||
      /Access denied for orders field/i.test(msg);
    return json<LoaderOut>({ ok: false, message: msg, pcdDenied }, { status: 200 });
  }
}

export default function OrdersPage() {
  const payload = useLoaderData<LoaderOut>();

  if (!payload.ok) {
    return (
      <Page title="Orders export (API)">
        <Banner tone="critical" title="Error loading orders">
          <p style={{ whiteSpace: "pre-wrap" }}>{payload.message}</p>
         {payload.pcdDenied && <p>Apparently there is no access to Protected Customer Data (Orders). Check Step 1 and scopes.</p>}
        </Banner>
      </Page>
    );
  }

  const data = payload.data;
  const orders: OrderNode[] = (data.edges ?? []).map(e => e.node);

  const { selectedResources, allResourcesSelected, handleSelectionChange, clearSelection } =
    useIndexResourceState(orders, { resourceIDResolver: (o) => o.id });

  const itemPreview = (o: OrderNode) => {
    const items = o.lineItems.edges;
    if (!items.length) return "—";
    const show = items.slice(0, 3).map(({ node: n }) => {
      const price = toNum(n.originalUnitPriceSet?.shopMoney?.amount);
      const total = toNum(n.discountedTotalSet?.shopMoney?.amount);
      const pricePart = total != null ? ` = ${num(total)}` : (price != null ? ` @ ${num(price)}` : "");
      return `${n.name || ""}${n.sku ? ` [${n.sku}]` : ""} × ${n.quantity}${pricePart}`;
    }).join("; ");
    return show + (items.length > 3 ? ` …(+${items.length - 3})` : "");
  };

  const rowMarkup = orders.map((o, index) => {
    const orderTotal = toNum(o.totalPriceSet?.shopMoney?.amount);
    return (
      <IndexTable.Row id={o.id} key={o.id} selected={selectedResources.includes(o.id)} position={index}>
        <IndexTable.Cell><Text as="span" fontWeight="bold">{o.name}</Text></IndexTable.Cell>
        <IndexTable.Cell><span suppressHydrationWarning>{fmtUTC(o.createdAt)}</span></IndexTable.Cell>
        <IndexTable.Cell>{o.lineItems.edges.length}</IndexTable.Cell>
        <IndexTable.Cell>{num(orderTotal)}</IndexTable.Cell>
        <IndexTable.Cell><Text as="span" breakWord>{itemPreview(o)}</Text></IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  const onExportClient = () => {
    const header = [
      "order","createdAt","orderTotal","lineItemTitle","sku","quantity","lineItemPrice","lineItemTotal","id"
    ];
    const lines: string[] = [header.join(",")];

    for (const o of orders) {
      if (!selectedResources.includes(o.id)) continue;

      const orderTotal = toNum(o.totalPriceSet?.shopMoney?.amount);
      const items = o.lineItems?.edges ?? [];

      if (items.length === 0) {
        lines.push([
          csvEscape(o.name),
          csvEscape(o.createdAt),
          csvEscape(num(orderTotal)),
          "", "", "", "", "",
          csvEscape(o.id),
        ].join(","));
        continue;
      }

      for (const { node: n } of items) {
        const price = toNum(n.originalUnitPriceSet?.shopMoney?.amount);
        const total = toNum(n.discountedTotalSet?.shopMoney?.amount) ??
                      (price != null ? price * (n.quantity || 0) : undefined);
        lines.push([
          csvEscape(o.name),
          csvEscape(o.createdAt),
          csvEscape(num(orderTotal)),
          csvEscape(n.name || ""),
          csvEscape(n.sku || ""),
          csvEscape(n.quantity ?? 0),
          csvEscape(num(price)),
          csvEscape(num(total)),
          csvEscape(o.id),
        ].join(","));
      }
    }

    downloadCsv(`orders_export_${Date.now()}.csv`, lines.join("\n"));
  };

  return (
    <Page title="Orders export (API)">
      <InlineGrid columns={{ xs: "1fr", sm: "1fr auto" }} gap="400">
        <Box><Text as="p">Mark the orders and click Export - the data is taken from the Admin GraphQL API.</Text></Box>
        <InlineStack align="end" gap="300">
          <Button variant="primary" onClick={onExportClient} disabled={!selectedResources.length}>
            Export CSV
          </Button>
          <Button onClick={clearSelection} disabled={!selectedResources.length}>Clear selection</Button>
        </InlineStack>
      </InlineGrid>

      <Card>
        <IndexTable
          resourceName={{ singular: "order", plural: "orders" }}
          itemCount={orders.length}
          selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
          onSelectionChange={handleSelectionChange}
          headings={[
            { title: "Order" },
            { title: "Created at" },
            { title: "Items" },
            { title: "Order total" },
            { title: "Line items" },
          ]}
        >
          {rowMarkup}
        </IndexTable>
      </Card>
    </Page>
  );
}
