export interface UTASIContract {
    SalesOrderCode: string;
    ReferenceNo: string;
    SalesOrderDate: string;
    DebtorName: string;
    TotalAmount: number;
    TaxTotalAmount: number;
    NetTotalAmount: number;
    IsCancelled:boolean;
    IsClosed: boolean;
    ProjectId: number;
    ProjectCode: string;
    ProjectDesc: string;
    StockId: string;
    cDesc: string;
    StockName: string;
    StockDesc?: string;
    Qty: number;
    unitprice: number;
    Amount: number;
    TaxAmount: number;
    NetAmount: number;
    DateRef1: string;
    DateRef2: string;
    isActive: number
}