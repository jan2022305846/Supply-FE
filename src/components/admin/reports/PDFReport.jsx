import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// PDF styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    padding: 5,
  },
  text: {
    fontSize: 10,
  },
});

// PDF Document Component
const ReportDocument = ({ title, dateRange, activityLogs, requestStats, itemStats }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Supply Office Report</Text>
        <Text>{title}</Text>
        <Text>Period: {dateRange}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.subtitle}>Activity Summary</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.text}>Date</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.text}>User</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.text}>Action</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.text}>Description</Text>
            </View>
          </View>

          {activityLogs.slice(0, 20).map((log, i) => (
            <View style={styles.tableRow} key={i}>
              <View style={styles.tableCol}>
                <Text style={styles.text}>{new Date(log.timestamp).toLocaleDateString()}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.text}>{log.user?.name || 'Unknown'}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.text}>{log.action}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.text}>{log.description}</Text>
              </View>
            </View>
          ))}
        </View>
        
        <Text style={styles.subtitle}>Request Statistics</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.text}>Status</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.text}>Count</Text>
            </View>
          </View>
          
          {Object.entries(requestStats).map(([status, count], i) => (
            <View style={styles.tableRow} key={i}>
              <View style={styles.tableCol}>
                <Text style={styles.text}>{status}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.text}>{count}</Text>
              </View>
            </View>
          ))}
        </View>
        
        <Text style={styles.subtitle}>Low Stock Items</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.text}>Item</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.text}>Quantity</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.text}>Category</Text>
            </View>
          </View>
          
          {itemStats.lowStock.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <View style={styles.tableCol}>
                <Text style={styles.text}>{item.name}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.text}>{item.quantity} {item.unit}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.text}>{item.category?.name || 'Uncategorized'}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Page>
  </Document>
);

export default ReportDocument;