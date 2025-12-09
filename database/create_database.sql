-- =============================================
-- Mobile App Database Creation Script
-- Database: mobileApp
-- SQL Server Version: SQL Server 2019+
-- =============================================

-- Create Database
USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'mobileApp')
BEGIN
    ALTER DATABASE mobileApp SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE mobileApp;
END
GO

CREATE DATABASE mobileApp;
GO

USE mobileApp;
GO

-- =============================================
-- Table 1: Customers (for QR Code Lookup)
-- =============================================
CREATE TABLE Customers (
    CustomerID NVARCHAR(50) PRIMARY KEY,
    CustomerName NVARCHAR(200) NOT NULL,
    MobileNo NVARCHAR(20) NOT NULL,
    WhatsAppNo NVARCHAR(20),
    CustomerType NVARCHAR(50),
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_Customers_MobileNo UNIQUE (MobileNo)
);
GO

-- Create Index on MobileNo for faster QR code lookups
CREATE INDEX IX_Customers_MobileNo ON Customers(MobileNo);
GO

-- =============================================
-- Table 2: EmployeeSaleInvoiceMain
-- Contains: Transaction Details, Voucher, Header, Collections
-- =============================================
CREATE TABLE EmployeeSaleInvoiceMain (
    InvoiceID BIGINT IDENTITY(1,1) PRIMARY KEY,
    
    -- Voucher Fields (COMMON across all 3 tables: Main, Items, Adjustments)
    -- These same values are stored in EmployeeSaleInvoiceItems and EmployeeSaleInvoiceAdjustments
    VoucherSeries NVARCHAR(50) NOT NULL,
    VoucherNo NVARCHAR(50) NOT NULL,
    VoucherDatetime DATETIME NOT NULL,
    
    -- Transaction Details
    TransactionId NVARCHAR(100),
    TransactionDate NVARCHAR(20),
    TransactionTime NVARCHAR(20),
    Status NVARCHAR(50) DEFAULT 'Pending',
    Branch NVARCHAR(100),
    Location NVARCHAR(100),
    EmployeeLocation NVARCHAR(100),
    Username NVARCHAR(100),
    
    -- Header Fields
    HeaderDate NVARCHAR(20),
    BillerName NVARCHAR(200),
    EmployeeName NVARCHAR(200), -- Previously "Party"
    CustomerID NVARCHAR(50), -- FK to Customers table
    CustomerName NVARCHAR(200), -- Denormalized for quick access
    ReadingA4 NVARCHAR(50),
    ReadingA3 NVARCHAR(50),
    MachineType NVARCHAR(200),
    Remarks NVARCHAR(MAX),
    GstBill BIT DEFAULT 0,
    
    -- Collections
    CollectedCash DECIMAL(18,2) DEFAULT 0,
    CollectedCard DECIMAL(18,2) DEFAULT 0,
    CollectedUpi DECIMAL(18,2) DEFAULT 0,
    Balance DECIMAL(18,2) DEFAULT 0,
    
    -- Summary Fields (calculated, stored for reporting)
    ItemCount INT DEFAULT 0,
    TotalQty DECIMAL(18,2) DEFAULT 0,
    TotalGross DECIMAL(18,2) DEFAULT 0,
    TotalDiscount DECIMAL(18,2) DEFAULT 0,
    TotalAdd DECIMAL(18,2) DEFAULT 0,
    TotalLess DECIMAL(18,2) DEFAULT 0,
    TotalBillValue DECIMAL(18,2) DEFAULT 0,
    LedgerBalance DECIMAL(18,2) DEFAULT 0,
    
    -- Audit Fields
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    CreatedBy NVARCHAR(100),
    ModifiedBy NVARCHAR(100),
    
    -- Foreign Key
    CONSTRAINT FK_EmployeeSaleInvoiceMain_Customers 
        FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    
    -- Unique Constraint on Voucher Series + Number
    CONSTRAINT UQ_EmployeeSaleInvoiceMain_Voucher 
        UNIQUE (VoucherSeries, VoucherNo)
);
GO

-- Create Indexes for better query performance
CREATE INDEX IX_EmployeeSaleInvoiceMain_CustomerID ON EmployeeSaleInvoiceMain(CustomerID);
CREATE INDEX IX_EmployeeSaleInvoiceMain_Voucher ON EmployeeSaleInvoiceMain(VoucherSeries, VoucherNo);
CREATE INDEX IX_EmployeeSaleInvoiceMain_TransactionDate ON EmployeeSaleInvoiceMain(TransactionDate);
GO

-- =============================================
-- Table 3: EmployeeSaleInvoiceItems
-- Contains: Item Body Details
-- =============================================
CREATE TABLE EmployeeSaleInvoiceItems (
    ItemID BIGINT IDENTITY(1,1) PRIMARY KEY,
    InvoiceID BIGINT NOT NULL, -- FK to EmployeeSaleInvoiceMain
    
    -- Voucher Fields (COMMON across all 3 tables: Main, Items, Adjustments)
    -- Same VoucherSeries and VoucherNo as EmployeeSaleInvoiceMain
    VoucherSeries NVARCHAR(50) NOT NULL,
    VoucherNo NVARCHAR(50) NOT NULL,
    
    -- Item Details
    SNo INT NOT NULL,
    ProductId INT,
    ProductName NVARCHAR(200) NOT NULL,
    ProductSerialNo NVARCHAR(200), -- For unique serial tracking
    Quantity DECIMAL(18,3) NOT NULL DEFAULT 0,
    Rate DECIMAL(18,2) NOT NULL DEFAULT 0,
    Gross DECIMAL(18,2) DEFAULT 0,
    Net DECIMAL(18,2) DEFAULT 0,
    
    -- Extended Fields
    Comments1 NVARCHAR(500),
    SalesMan NVARCHAR(100),
    FreeQty DECIMAL(18,3) DEFAULT 0,
    Comments6 NVARCHAR(500),
    
    -- Audit Fields
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    
    -- Foreign Key
    CONSTRAINT FK_EmployeeSaleInvoiceItems_Invoice 
        FOREIGN KEY (InvoiceID) REFERENCES EmployeeSaleInvoiceMain(InvoiceID) ON DELETE CASCADE
);
GO

-- Create Indexes
CREATE INDEX IX_EmployeeSaleInvoiceItems_InvoiceID ON EmployeeSaleInvoiceItems(InvoiceID);
CREATE INDEX IX_EmployeeSaleInvoiceItems_Voucher ON EmployeeSaleInvoiceItems(VoucherSeries, VoucherNo);
CREATE INDEX IX_EmployeeSaleInvoiceItems_ProductSerialNo ON EmployeeSaleInvoiceItems(ProductSerialNo);
GO

-- =============================================
-- Table 4: EmployeeSaleInvoiceAdjustments
-- Contains: Adjustments Details
-- =============================================
CREATE TABLE EmployeeSaleInvoiceAdjustments (
    AdjustmentID BIGINT IDENTITY(1,1) PRIMARY KEY,
    InvoiceID BIGINT NOT NULL, -- FK to EmployeeSaleInvoiceMain
    
    -- Voucher Fields (COMMON across all 3 tables: Main, Items, Adjustments)
    -- Same VoucherSeries and VoucherNo as EmployeeSaleInvoiceMain
    VoucherSeries NVARCHAR(50) NOT NULL,
    VoucherNo NVARCHAR(50) NOT NULL,
    
    -- Adjustment Details
    AccountId INT,
    AccountName NVARCHAR(200) NOT NULL,
    AccountType NVARCHAR(20) NOT NULL, -- 'add' or 'less'
    AddAmount DECIMAL(18,2) DEFAULT 0,
    LessAmount DECIMAL(18,2) DEFAULT 0,
    Comments NVARCHAR(500),
    
    -- Audit Fields
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    
    -- Foreign Key
    CONSTRAINT FK_EmployeeSaleInvoiceAdjustments_Invoice 
        FOREIGN KEY (InvoiceID) REFERENCES EmployeeSaleInvoiceMain(InvoiceID) ON DELETE CASCADE
);
GO

-- Create Indexes
CREATE INDEX IX_EmployeeSaleInvoiceAdjustments_InvoiceID ON EmployeeSaleInvoiceAdjustments(InvoiceID);
CREATE INDEX IX_EmployeeSaleInvoiceAdjustments_Voucher ON EmployeeSaleInvoiceAdjustments(VoucherSeries, VoucherNo);
GO

-- =============================================
-- Sample Data for Testing
-- =============================================

-- Insert Sample Customers
INSERT INTO Customers (CustomerID, CustomerName, MobileNo, WhatsAppNo, CustomerType)
VALUES 
    ('CUST-001', 'John Doe', '9876543210', '9876543210', 'Regular'),
    ('CUST-002', 'Jane Smith', '9876543211', '9876543211', 'Premium'),
    ('CUST-003', 'ABC Enterprises', '9876543212', '9876543212', 'Corporate');
GO

-- =============================================
-- Stored Procedures for Common Operations
-- =============================================

-- Stored Procedure: Get Customer by Mobile Number (for QR Code Lookup)
CREATE PROCEDURE sp_GetCustomerByMobile
    @MobileNo NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CustomerID,
        CustomerName,
        MobileNo,
        WhatsAppNo,
        CustomerType
    FROM Customers
    WHERE MobileNo = @MobileNo;
END
GO

-- Stored Procedure: Get Customer by CustomerID
CREATE PROCEDURE sp_GetCustomerByID
    @CustomerID NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CustomerID,
        CustomerName,
        MobileNo,
        WhatsAppNo,
        CustomerType
    FROM Customers
    WHERE CustomerID = @CustomerID;
END
GO

-- Stored Procedure: Get Invoice by Voucher Series and Number
CREATE PROCEDURE sp_GetInvoiceByVoucher
    @VoucherSeries NVARCHAR(50),
    @VoucherNo NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get Main Invoice Data
    SELECT * FROM EmployeeSaleInvoiceMain
    WHERE VoucherSeries = @VoucherSeries AND VoucherNo = @VoucherNo;
    
    -- Get Items
    SELECT * FROM EmployeeSaleInvoiceItems
    WHERE VoucherSeries = @VoucherSeries AND VoucherNo = @VoucherNo
    ORDER BY SNo;
    
    -- Get Adjustments
    SELECT * FROM EmployeeSaleInvoiceAdjustments
    WHERE VoucherSeries = @VoucherSeries AND VoucherNo = @VoucherNo;
END
GO

-- =============================================
-- Views for Reporting
-- =============================================

-- View: Complete Invoice View with all related data
CREATE VIEW vw_EmployeeSaleInvoiceComplete AS
SELECT 
    m.InvoiceID,
    m.VoucherSeries,
    m.VoucherNo,
    m.VoucherDatetime,
    m.TransactionId,
    m.TransactionDate,
    m.TransactionTime,
    m.Status,
    m.Branch,
    m.Location,
    m.EmployeeLocation,
    m.Username,
    m.HeaderDate,
    m.BillerName,
    m.EmployeeName,
    m.CustomerID,
    m.CustomerName,
    m.ReadingA4,
    m.ReadingA3,
    m.MachineType,
    m.Remarks,
    m.GstBill,
    m.CollectedCash,
    m.CollectedCard,
    m.CollectedUpi,
    m.Balance,
    m.TotalBillValue,
    m.CreatedDate,
    -- Item Count
    (SELECT COUNT(*) FROM EmployeeSaleInvoiceItems WHERE InvoiceID = m.InvoiceID) AS ItemCount,
    -- Adjustment Count
    (SELECT COUNT(*) FROM EmployeeSaleInvoiceAdjustments WHERE InvoiceID = m.InvoiceID) AS AdjustmentCount
FROM EmployeeSaleInvoiceMain m;
GO

-- =============================================
-- Script Completion Message
-- =============================================
PRINT 'Database "mobileApp" created successfully!';
PRINT 'Tables created:';
PRINT '  1. Customers';
PRINT '  2. EmployeeSaleInvoiceMain';
PRINT '  3. EmployeeSaleInvoiceItems';
PRINT '  4. EmployeeSaleInvoiceAdjustments';
PRINT '';
PRINT 'Stored Procedures created:';
PRINT '  1. sp_GetCustomerByMobile';
PRINT '  2. sp_GetCustomerByID';
PRINT '  3. sp_GetInvoiceByVoucher';
PRINT '';
PRINT 'Views created:';
PRINT '  1. vw_EmployeeSaleInvoiceComplete';
PRINT '';
PRINT 'Sample customer data inserted.';
GO

