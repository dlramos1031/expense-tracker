import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

// Define the Expense interface
interface Expense {
  id: string;
  amount: number;
  tag: string;
  description: string;
  timestamp: string;
}

export default function ExpenseInputScreen() {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [tag, setTag] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const availableTags: string[] = ['Food', 'Commute', 'Shopping', 'Entertainment'];

  useEffect(() => {
    const loadRecentExpenses = async () => {
      try {
        const storedExpenses = await AsyncStorage.getItem('expenses');
        if (storedExpenses) {
          const parsedExpenses: Expense[] = JSON.parse(storedExpenses);
          setRecentExpenses(parsedExpenses.slice(0, 3));
        }
      } catch (error) {
        console.error("Error loading expenses:", error);
      }
    };
    loadRecentExpenses();
  }, []);

  const saveExpense = async () => {
    if (!amount || !tag || !description) {
      alert("Please fill out all fields.");
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      tag,
      description,
      timestamp: date.toISOString(),
    };

    try {
      const existingExpenses = await AsyncStorage.getItem('expenses');
      const expenses: Expense[] = existingExpenses ? JSON.parse(existingExpenses) : [];
      const updatedExpenses: Expense[] = [newExpense, ...expenses];
      await AsyncStorage.setItem('expenses', JSON.stringify(updatedExpenses));
      setRecentExpenses(updatedExpenses.slice(0, 3));
      setAmount('');
      setDescription('');
      setTag('');
      setDate(new Date());
      alert("Expense saved!");
    } catch (error) {
      console.error("Error saving expense:", error);
      alert("Error saving expense. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps='handled'>
        <View style={styles.recentExpensesContainer}>
          <Text style={styles.recentTitle}>Recent Expenses</Text>
          {recentExpenses.map((expense) => (
            <Text key={expense.id} style={styles.recentItem}>
              {expense.tag}: ${expense.amount.toFixed(2)} - {expense.description}
            </Text>
          ))}
        </View>
        <View style={styles.inputContainer}>
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
            multiline
            numberOfLines={3}
            onChangeText={setDescription}
          />
          <View style={styles.input}>
            <Picker selectedValue={tag} onValueChange={(itemValue) => setTag(itemValue)}>
              <Picker.Item label="Select Category" value="" />
              {availableTags.map((tagItem) => (
                <Picker.Item label={tagItem} value={tagItem} key={tagItem} />
              ))}
            </Picker>
          </View>
          <TouchableOpacity style={styles.datePickerContainer} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
            <Ionicons name="calendar" size={20} color="black" style={styles.dateIcon} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={saveExpense}>
          <Text style={styles.saveButtonText}>Save Expense</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  recentExpensesContainer: {
    marginBottom: 20,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  recentItem: {
    fontSize: 16,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
  },
  dateIcon: {
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

