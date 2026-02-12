
export enum UserRole {
  DEVELOPER = 'DEVELOPER',
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR'
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI'
}

export enum LotStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID'
}

export interface LotStageRate {
  id: string;
  name: string;
  rate: number;
}

export interface LotExtraDetail {
  id: string;
  label: string;
  value: string;
}

export interface Worker {
  id: string;
  name: string;
  mobile: string;
  photo?: string; // base64
  skill: string;
  rates: Record<string, number>; // stageId -> rate
  advanceBalance: number;
  paymentMethod: PaymentMethod;
  upiId?: string;
  qrCode?: string; // base64
  isActive: boolean;
  createdAt: number;
}

export interface Lot {
  id: string;
  lotNumber: string;
  date: string;
  design: string;
  color: string;
  description?: string;
  extraDetails?: LotExtraDetail[];
  totalQuantity: number;
  status: LotStatus;
  stageRates: LotStageRate[];
  createdAt: number;
}

export interface Stage {
  id: string;
  name: string;
  baseRate: number;
}

export interface JobWork {
  id: string;
  workerId: string;
  lotId: string;
  stageId: string;
  date: string;
  qtyGiven: number;
  qtyCompleted: number;
  rateAtTime: number;
  paymentId?: string;
  createdAt: number;
}

export interface Payment {
  id: string;
  workerId: string;
  jobWorkIds: string[];
  totalAmount: number;
  advanceDeducted: number;
  netPayable: number;
  method: PaymentMethod; 
  date: string;
  status: PaymentStatus;
  createdAt: number;
}

export interface AdvanceTransaction {
  id: string;
  workerId: string;
  amount: number;
  date: string;
  type: 'GIVEN' | 'RECOVERED';
  note?: string;
  createdAt: number;
}
