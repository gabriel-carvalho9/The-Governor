export interface Budget {
  cash: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  revenueBreakdown: {
    taxes: number;
    feesAndServices: number;
    transfers: number;
  };
  expenseBreakdown: {
    publicServices: number;
    payroll: number;
    maintenance: number;
    debtService: number;
  };
}