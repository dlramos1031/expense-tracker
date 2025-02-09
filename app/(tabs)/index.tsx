import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList
} from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigationProps, RootStackParamList } from '../types';

interface Expense {
  id: string;
  amount: number;
  tag: string;
  description: string;
  timestamp: string;
}

export default function index() {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const params = route.params as { expense?: Expense } | undefined;
  const editingExpense: Expense | null = params?.expense || null;

  const [amount, setAmount] = useState('');
  const [tag, setTag] = useState('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadExpenses();
    if (editingExpense) {
      setAmount(editingExpense.amount.toString());
      setTag(editingExpense.tag);
      setDescription(editingExpense.description);
      setDate(new Date(editingExpense.timestamp));
      setIsEditing(true);
    }
  }, [editingExpense]);

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

  const saveExpense = async () => {
    if (!amount || !description) return;

    const newExpense: Expense = {
      id: isEditing ? editingExpense!.id : new Date().getTime().toString(),
      amount: parseFloat(amount),
      tag,
      description,
      timestamp: date.toISOString(),
    };

    let updatedExpenses = isEditing
      ? expenses.map(exp => (exp.id === editingExpense!.id ? newExpense : exp))
      : [newExpense, ...expenses];

    try {
      await AsyncStorage.setItem('expenses', JSON.stringify(updatedExpenses));
      setExpenses(updatedExpenses);
      resetForm();
      navigation.navigate('ExpenseHistoryScreen');
    } catch (error) {
      console.error("Error saving expense:", error);
    }
  };

  const resetForm = () => {
    setAmount('');
    setTag('Food');
    setDescription('');
    setDate(new Date());
    setIsEditing(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.container}
      >
        {/* Mini History Card */}
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Recent Expenses</Text>
          <FlatList
            data={expenses.slice(0, 3)} // Show only the last 3 expenses
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.historyItem}>
                <Text style={styles.historyTag}>{item.tag}</Text>
                <Text style={styles.historyAmount}>${item.amount.toFixed(2)}</Text>
              </View>
            )}
          />
        </View>

        {/* Expense Input Form */}
        <View style={styles.formContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Amount" 
            keyboardType="numeric" 
            value={amount} 
            onChangeText={setAmount} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Description" 
            value={description} 
            onChangeText={setDescription} 
          />
          
          <Text style={styles.label}>Category</Text>
          <TextInput 
            style={styles.input} 
            value={tag} 
            onChangeText={setTag} 
          />

          <Text style={styles.label}>Date</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputDate}
              value={date.toLocaleDateString()}
              editable={false} // Prevent manual input
            />
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.iconButton}>
              <Ionicons name="calendar" size={24} color="#555" />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          {/* Save Button with Edit Mode Indicator */}
          <Button
            title={isEditing ? "Update Expense" : "Save Expense"}
            color={isEditing ? "orange" : "blue"}
            onPress={saveExpense}
          />
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#f5f5f5' 
  },
  historyContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  historyTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 5 
  },
  historyItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 5 
  },
  historyTag: { 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  historyAmount: { 
    fontSize: 14, 
    color: '#555' 
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
    marginTop: 'auto' // Moves form to the bottom
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  label: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginBottom: 5 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  inputDate: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    color: '#333',
  },
  iconButton: {
    padding: 8,
  },  
});
