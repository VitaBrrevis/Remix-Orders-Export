// app/utils/csv.ts
type OrderNode = {
    id: string;
    name: string;
    createdAt: string;
    customer?: { displayName?: string | null; email?: string | null } | null;
    lineItems: {
        edges: Array<{
            node: {
                id: string;
                title: string;
                quantity: number;
                sku?: string | null;
                originalUnitPriceSet?: { shopMoney?: { amount?: string; currencyCode?: string } };
            };
        }>;
    };
};

function csvEscape(value: unknown): string {
    if (value === null || value === undefined) return '';
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ordersToCsv(orders: OrderNode[]): string {
    const headers = [
        'order_id', 'order_name', 'order_created_at', 'customer_name', 'customer_email',
        'line_item_id', 'line_item_title', 'line_item_sku', 'quantity', 'unit_price', 'currency'
    ];

    const rows: string[] = [];

    for (const o of orders) {
        const customerName = o.customer?.displayName ?? '';
        const customerEmail = o.customer?.email ?? '';
        for (const edge of o.lineItems.edges) {
            const li = edge.node;
            const price = li.originalUnitPriceSet?.shopMoney?.amount ?? '';
            const currency = li.originalUnitPriceSet?.shopMoney?.currencyCode ?? '';
            rows.push([
                csvEscape(o.id),
                csvEscape(o.name),
                csvEscape(o.createdAt),
                csvEscape(customerName),
                csvEscape(customerEmail),
                csvEscape(li.id),
                csvEscape(li.title),
                csvEscape(li.sku ?? ''),
                csvEscape(li.quantity),
                csvEscape(price),
                csvEscape(currency),
            ].join(','));
        }
    }

    return [headers.join(','), ...rows].join('\n');
}
