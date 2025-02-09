import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

export type Expense = {
  id: string;
  amount: number;
  tag: string;
  description: string;
  timestamp: string;
};

export type RootStackParamList = {
  ExpenseInputScreen: { expense?: Expense }; // `expense` is optional for adding new expenses
  ExpenseHistoryScreen: undefined;
};

// Navigation Prop Type
export type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

// Route Prop Type (For Screens Receiving Params)
export type ExpenseInputScreenRouteProp = RouteProp<RootStackParamList, 'ExpenseInputScreen'>;
