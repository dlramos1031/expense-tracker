import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps, RootStackParamList } from '../types';

interface Expense {
  id: string;
  amount: number;
  tag: string;
  description: string;
  timestamp: string;
}

export default function ExpenseHistoryScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [deletedExpense, setDeletedExpense] = useState<Expense | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest');
  const [refreshing, setRefreshing] = useState(false);
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);

  const navigation = useNavigation<NavigationProps>();

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [expenses, searchQuery, categoryFilter, sortOrder]);

  const loadExpenses = async () => {
    try {
      const storedExpenses = await AsyncStorage.getItem('expenses');
      if (storedExpenses) {
        const parsedExpenses: Expense[] = JSON.parse(storedExpenses);
        setExpenses(parsedExpenses.reverse());
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let updatedExpenses = [...expenses];

    if (searchQuery) {
      updatedExpenses = updatedExpenses.filter(expense =>
        expense.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'All') {
      updatedExpenses = updatedExpenses.filter(expense => expense.tag === categoryFilter);
    }

    if (sortOrder === 'Newest') {
      updatedExpenses.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      updatedExpenses.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    setFilteredExpenses(updatedExpenses);
  };

  const deleteExpense = async (id: string) => {
    const updatedExpenses = expenses.filter(expense => expense.id !== id);
    const removedExpense = expenses.find(expense => expense.id === id) || null;
    if (!removedExpense) return;
  
    try {
      await AsyncStorage.setItem('expenses', JSON.stringify(updatedExpenses));
      setExpenses(updatedExpenses);
      setFilteredExpenses(updatedExpenses); // Ensure filtered list updates too
      setDeletedExpense(removedExpense);
      setUndoVisible(true);
  
      if (undoTimeout.current) clearTimeout(undoTimeout.current);
      undoTimeout.current = setTimeout(() => setUndoVisible(false), 10000);
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };
  
  const undoDelete = async () => {
    if (!deletedExpense) return;
  
    // Re-insert the deleted expense at the correct position
    const updatedExpenses = [...expenses, deletedExpense];
  
    try {
      await AsyncStorage.setItem('expenses', JSON.stringify(updatedExpenses));
      setExpenses(updatedExpenses);
      setFilteredExpenses(updatedExpenses); // Ensure filtered list updates too
      setDeletedExpense(null);
      setUndoVisible(false);
    } catch (error) {
      console.error("Error restoring expense:", error);
    }
  };  

  const renderExpense = ({ item }: { item: Expense }) => {
    const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, item: Expense) => {
      return (
        <Animated.View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#007BFF' }]}
            onPress={() => navigation.navigate('index', { expense: item })}
          >
            <Ionicons name="pencil" size={24} color="white" />
          </TouchableOpacity>
    
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'red' }]} onPress={() => deleteExpense(item.id)}>
            <Ionicons name="trash" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      );
    };

    return (
      <Swipeable renderRightActions={(progress) => renderRightActions(progress, item)}>
        <View style={styles.card}>
          <Text style={styles.tag}>{item.tag}</Text>
          <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleDateString()}</Text>
        </View>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search expenses..."
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Ionicons name="search" size={20} color="#555" style={styles.searchIcon} />
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <Picker selectedValue={categoryFilter} onValueChange={setCategoryFilter} style={styles.picker}>
          <Picker.Item label="All Categories" value="All" />
          <Picker.Item label="Food" value="Food" />
          <Picker.Item label="Commute" value="Commute" />
          <Picker.Item label="Shopping" value="Shopping" />
          <Picker.Item label="Entertainment" value="Entertainment" />
        </Picker>
        <Picker selectedValue={sortOrder} onValueChange={setSortOrder} style={styles.picker}>
          <Picker.Item label="Newest" value="Newest" />
          <Picker.Item label="Oldest" value="Oldest" />
        </Picker>
      </View>

      {/* Expense List */}
      <FlatList
        data={filteredExpenses}
        renderItem={renderExpense}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {/* Undo Snackbar */}
      {undoVisible && (
        <View style={styles.undoContainer}>
          <Text style={styles.undoText}>Expense deleted.</Text>
          <TouchableOpacity onPress={undoDelete}>
            <Text style={styles.undoButton}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5', 
    padding: 10 
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
  },
  searchInput: { 
    flex: 1 
  },
  searchIcon: { 
    marginLeft: 10 
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  picker: { 
    flex: 1 
  },
  list: { 
    paddingBottom: 80 
  },
  deleteContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    backgroundColor: 'red',
    borderRadius: 10,
    marginBottom: 10,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: '100%',
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  tag: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#007BFF' 
  },
  amount: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginVertical: 5 
  },
  description: { 
    fontSize: 14, 
    color: '#555' 
  },
  timestamp: { 
    fontSize: 12, 
    color: '#999', 
    marginTop: 5 
  },
  undoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  undoText: { 
    color: 'white' 
  },
  undoButton: { 
    textDecorationLine: 'underline', 
    color: 'white' 
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: '100%',
    borderRadius: 10,
    marginHorizontal: 5,
  },
});
