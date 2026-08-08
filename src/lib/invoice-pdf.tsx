import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#20242c" },
  header: { marginBottom: 24 },
  businessName: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  small: { fontSize: 9, color: "#454c5a" },
  title: { fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  block: { width: "48%" },
  label: { fontSize: 9, color: "#454c5a", marginBottom: 2 },
  table: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#c9ced4" },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#c9ced4",
    paddingVertical: 6,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e5e8",
    paddingVertical: 6,
  },
  colDesc: { width: "50%" },
  colQty: { width: "15%", textAlign: "right" },
  colUnit: { width: "15%", textAlign: "right" },
  colTotal: { width: "20%", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16 },
  totalLabel: { fontSize: 12, fontWeight: 700, marginRight: 12 },
  totalValue: { fontSize: 12, fontWeight: 700 },
  legal: { marginTop: 32, fontSize: 8.5, color: "#454c5a", lineHeight: 1.5 },
});

function formatEUR(n: number) {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(n);
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export type InvoicePdfData = {
  number: string;
  issueDate: Date;
  status: "PAID" | "CANCELLED";
  clientName: string;
  clientAddress?: string | null;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  totalAmount: number;
  business: {
    name: string;
    address: string;
    tvaNumber?: string | null;
    bceNumber?: string | null;
  };
};

export function InvoicePdfDocument({ data }: { data: InvoicePdfData }) {
  return (
    <Document title={`Facture ${data.number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.businessName}>{data.business.name}</Text>
          <Text style={styles.small}>{data.business.address}</Text>
          {data.business.bceNumber && <Text style={styles.small}>N° BCE : {data.business.bceNumber}</Text>}
          <Text style={styles.small}>
            N° TVA : {data.business.tvaNumber || "Franchise de taxe — non applicable"}
          </Text>
        </View>

        <Text style={styles.title}>
          FACTURE {data.number}
          {data.status === "CANCELLED" ? "  (ANNULÉE)" : ""}
        </Text>

        <View style={styles.row}>
          <View style={styles.block}>
            <Text style={styles.label}>Facturé à</Text>
            <Text>{data.clientName}</Text>
            {data.clientAddress && <Text>{data.clientAddress}</Text>}
          </View>
          <View style={styles.block}>
            <Text style={styles.label}>Date de facture</Text>
            <Text>{formatDate(data.issueDate)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colUnit}>Prix unit.</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {data.items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{formatEUR(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{formatEUR(item.total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total à payer</Text>
          <Text style={styles.totalValue}>{formatEUR(data.totalAmount)}</Text>
        </View>

        <Text style={styles.legal}>
          TVA non applicable, régime de la franchise de la taxe (article 56bis du Code de la TVA belge).{"\n"}
          Montant payé au salon.
        </Text>
      </Page>
    </Document>
  );
}
