// index.tsx (ExpenseInputScreen)
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Platform, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Picker } from '@react-native-picker/picker';

export default function ExpenseInputScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const colorScheme = useColorScheme();
  const availableTags = ['Food', 'Commute', 'Shopping', 'Entertainment'];

  /**
   * Saves the expense to AsyncStorage.
   */
  const saveExpense = async () => {
    // Handles any empty fields
    if (!amount || !tag || !description) { 
      alert("Please fill out all fields.");
      return;
    }

    const newExpense = { // The newly saved expense
      amount: parseFloat(amount),
      tag,
      description,
      timestamp: date.toISOString(),
    };
    
    
    try {
      // Fetches exisitng expenses, adds new one, then puts back in JSON file
      const existingExpenses = await AsyncStorage.getItem('expenses');
      const expenses = existingExpenses ? JSON.parse(existingExpenses) : [];
      expenses.push(newExpense);
      await AsyncStorage.setItem('expenses', JSON.stringify(expenses));
      
      // Clears input fields after saving
      setAmount('');
      setDescription('');
      setTag('');
      setDate(new Date());
      alert("Expense saved!");

    } catch (error) { // Error handler
      console.error("Error saving expense:", error);
      alert("Error saving expense. Please try again.");
    }
  };

  /**
   * Handles date changes from the DateTimePicker.
   */
  const onChange = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].text }]}
          placeholder="Amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholderTextColor={Colors[colorScheme ?? 'light'].text}
        />
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].text }]}
          placeholder="Description"
          value={description}
          multiline
          numberOfLines={3}
          onChangeText={setDescription}
          placeholderTextColor={Colors[colorScheme ?? 'light'].text}
        />
        <View style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].text }]}>
          <Picker
            selectedValue={tag}
            dropdownIconColor={Colors[colorScheme ?? 'light'].text}
            style={{ color: Colors[colorScheme ?? 'light'].text }}
            onValueChange={(itemValue) => setTag(itemValue)}>
            {availableTags.map((tagItem, index) => (
              <Picker.Item label={tagItem} value={tagItem} key={index} />
            ))}
          </Picker>
        </View>

        <Button title="Select Date" onPress={() => setShowDatePicker(true)} color={Colors[colorScheme ?? 'light'].tint} />
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onChange}
          />
        )}
        <Text style={[styles.date, { color: Colors[colorScheme ?? 'light'].text }]}>
          Selected Date: {date.toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Save Expense" onPress={saveExpense} color={Colors[colorScheme ?? 'light'].tint} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
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
  buttonContainer: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  date: {
    fontSize: 20,
    marginTop: 10,
    alignSelf: "center",
  },
});