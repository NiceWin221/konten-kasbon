export type DebtType = "owed_to_me" | "i_owe";

export interface Debt {
  id: string;
  user_id: string;
  type: DebtType;
  counterpart_name: string;
  amount: number;
  note: string | null;
  due_date: string | null;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DebtFormData {
  type: DebtType;
  counterpart_name: string;
  amount: number | "";
  due_date: string;
  note: string;
}
