// two.tsx (ExpenseHistoryScreen)
import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function ExpenseHistoryScreen() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [filter, setFilter] = useState('overall');
  const [searchQuery, setSearchQuery] = useState('');
  const colorScheme = useColorScheme();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Load expenses from AsyncStorage
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const storedExpenses = await AsyncStorage.getItem('expenses');
        if (storedExpenses) {
          setExpenses(JSON.parse(storedExpenses));
        }
      } catch (error) {
        console.error("Error loading expenses:", error);
      }
    };

    loadExpenses();
  }, []);

  // Calculate total expenses
  const calculateTotalExpenses = (timePeriod: string): number => {
    const now = new Date();
    const today = now.toLocaleDateString();
    const currentWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const currentMonth = now.getMonth() + 1;

    let total = 0;
    if (timePeriod === "day") {
      total = expenses.filter(expense => new Date(expense.timestamp).toLocaleDateString() === today).reduce((sum, expense) => sum + expense.amount, 0);
    } else if (timePeriod === "week") {
      total = expenses.filter(expense => new Date(expense.timestamp) >= currentWeekStart).reduce((sum, expense) => sum + expense.amount, 0);
    } else if (timePeriod === "month") {
      total = expenses.filter(expense => new Date(expense.timestamp).getMonth() + 1 === currentMonth).reduce((sum, expense) => sum + expense.amount, 0);
    } else if (timePeriod === "overall") {
      total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    }
    return total;
  };

  // Filter expenses based on search query
  const filteredExpenses = expenses.filter(expense => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const lowerCaseTag = expense.tag ? expense.tag.toLowerCase() : "";
    const lowerCaseAmount = expense.amount ? expense.amount.toString().toLowerCase() : "";
    const lowerCaseDescription = expense.description ? expense.description.toLowerCase() : "";

    return (
      lowerCaseTag.includes(lowerCaseQuery) ||
      lowerCaseAmount.includes(lowerCaseQuery) ||
      lowerCaseDescription.includes(lowerCaseQuery)
    );
  });

  // Sort expenses by timestamp
  const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Toggle expand/collapse of expense description
  const toggleExpand = (id: string) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(id)) {
      newExpandedItems.delete(id);
    } else {
      newExpandedItems.add(id);
    }
    setExpandedItems(newExpandedItems);
  };

  // Function to refresh the expense list
  const refreshExpenses = async () => {
    try {
      const storedExpenses = await AsyncStorage.getItem('expenses');
      if (storedExpenses) {
        setExpenses(JSON.parse(storedExpenses));
      }
    } catch (error) {
      console.error("Error refreshing expenses:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <TextInput
        style={[styles.searchBar, { borderColor: Colors[colorScheme ?? 'light'].text }]}
        placeholder="Search by tag, amount, or description"
        placeholderTextColor={Colors[colorScheme ?? 'light'].text}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.filterButtons}>
        <Button title="Day" onPress={() => setFilter('day')} color={Colors[colorScheme ?? 'light'].tint} />
        <Button title="Week" onPress={() => setFilter('week')} color={Colors[colorScheme ?? 'light'].tint} />
        <Button title="Month" onPress={() => setFilter('month')} color={Colors[colorScheme ?? 'light'].tint} />
        <Button title="Overall" onPress={() => setFilter('overall')} color={Colors[colorScheme ?? 'light'].tint} />
      </View>

      <Text style={[styles.total, { color: Colors[colorScheme ?? 'light'].text }]}>
        Total ({filter}): {calculateTotalExpenses(filter)}
      </Text>

      <FlatList
        data={sortedExpenses}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleExpand(item.timestamp)}>
            <View style={styles.expenseItem}>
              <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>
                {item.tag}: ${item.amount ? item.amount.toFixed(2) : '0.00'}
              </Text>
              <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>{new Date(item.timestamp).toLocaleString()}</Text>
            </View>
            {expandedItems.has(item.timestamp) && (
              <View style={styles.descriptionContainer}>
                <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>Description: {item.description}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
      <View style={styles.refreshButtonContainer}> 
        <Button title="Refresh" onPress={refreshExpenses} color={Colors[colorScheme ?? 'light'].tint} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  descriptionContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  total: {
    fontSize: 20,
    margin: 10,
  },
  refreshButtonContainer: { 
    marginTop: 20, 
    borderRadius: 10,
    overflow: 'hidden', 
  },
});