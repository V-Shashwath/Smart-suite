-- =============================================
-- Smart Suite Database Schema
-- Microsoft SQL Server
-- =============================================

USE SmartSuite;
GO

-- =============================================
-- 1. Products Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Products' AND xtype='U')
CREATE TABLE Products (
    ProductId INT PRIMARY KEY IDENTITY(1,1),
    ProductName NVARCHAR(255) NOT NULL,
    ProductBarcode NVARCHAR(100),
    Rate DECIMAL(18,2) NOT NULL DEFAULT 0,
    HasUniqueSerialNo BIT NOT NULL DEFAULT 0,
    Category NVARCHAR(100),
    Stock INT DEFAULT 0,
    Description NVARCHAR(MAX),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_ProductBarcode UNIQUE (ProductBarcode)
);
GO

-- =============================================
-- 2. Customers Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Customers' AND xtype='U')
CREATE TABLE Customers (
    CustomerId NVARCHAR(50) PRIMARY KEY,
    CustomerName NVARCHAR(255) NOT NULL,
    MobileNo NVARCHAR(20),
    WhatsAppNo NVARCHAR(20),
    CustomerType NVARCHAR(50),
    Email NVARCHAR(255),
    Address NVARCHAR(MAX),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- 3. Branches Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Branches' AND xtype='U')
CREATE TABLE Branches (
    BranchId INT PRIMARY KEY IDENTITY(1,1),
    BranchName NVARCHAR(255) NOT NULL,
    BranchCode NVARCHAR(50),
    Address NVARCHAR(MAX),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- 4. Locations Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Locations' AND xtype='U')
CREATE TABLE Locations (
    LocationId INT PRIMARY KEY IDENTITY(1,1),
    LocationName NVARCHAR(255) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- 5. Users Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(100) NOT NULL UNIQUE,
    Password NVARCHAR(255), -- Hash passwords in production
    FullName NVARCHAR(255),
    Role NVARCHAR(50),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- 6. MachineTypes Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MachineTypes' AND xtype='U')
CREATE TABLE MachineTypes (
    MachineTypeId INT PRIMARY KEY IDENTITY(1,1),
    MachineType NVARCHAR(255) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- 7. AdjustmentAccounts Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AdjustmentAccounts' AND xtype='U')
CREATE TABLE AdjustmentAccounts (
    AdjustmentAccountId INT PRIMARY KEY IDENTITY(1,1),
    AccountName NVARCHAR(255) NOT NULL,
    AccountType NVARCHAR(50) CHECK (AccountType IN ('add', 'less')),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- 8. Invoices Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Invoices' AND xtype='U')
CREATE TABLE Invoices (
    InvoiceId INT PRIMARY KEY IDENTITY(1,1),
    VoucherNo NVARCHAR(50) NOT NULL,
    VoucherSeries NVARCHAR(50) NOT NULL,
    CustomerId NVARCHAR(50) FOREIGN KEY REFERENCES Customers(CustomerId),
    TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    TotalDiscount DECIMAL(18,2) DEFAULT 0,
    TotalAdd DECIMAL(18,2) DEFAULT 0,
    TotalLess DECIMAL(18,2) DEFAULT 0,
    NetAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    Status NVARCHAR(50) DEFAULT 'Pending',
    CreatedBy NVARCHAR(100),
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_VoucherNo UNIQUE (VoucherSeries, VoucherNo)
);
GO

-- =============================================
-- 9. InvoiceItems Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='InvoiceItems' AND xtype='U')
CREATE TABLE InvoiceItems (
    ItemId INT PRIMARY KEY IDENTITY(1,1),
    InvoiceId INT FOREIGN KEY REFERENCES Invoices(InvoiceId) ON DELETE CASCADE,
    ProductId INT FOREIGN KEY REFERENCES Products(ProductId),
    ProductName NVARCHAR(255) NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    Rate DECIMAL(18,2) NOT NULL,
    Gross DECIMAL(18,2) NOT NULL,
    Net DECIMAL(18,2) NOT NULL,
    ProductSerialNo NVARCHAR(255),
    Comments1 NVARCHAR(MAX),
    SalesMan NVARCHAR(255),
    FreeQty NVARCHAR(50),
    Comments6 NVARCHAR(MAX),
    CreatedDate DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- 10. InvoiceAdjustments Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='InvoiceAdjustments' AND xtype='U')
CREATE TABLE InvoiceAdjustments (
    AdjustmentId INT PRIMARY KEY IDENTITY(1,1),
    InvoiceId INT FOREIGN KEY REFERENCES Invoices(InvoiceId) ON DELETE CASCADE,
    AccountName NVARCHAR(255) NOT NULL,
    AddAmount DECIMAL(18,2) DEFAULT 0,
    LessAmount DECIMAL(18,2) DEFAULT 0,
    Comments NVARCHAR(MAX),
    CreatedDate DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- Sample Data Insertion
-- =============================================

-- Insert Sample Products
INSERT INTO Products (ProductName, ProductBarcode, Rate, HasUniqueSerialNo, Category) VALUES
('A4 Xerox - Black & White', '1', 2.00, 0, 'Printing'),
('A4 Xerox - Color', '2', 5.00, 0, 'Printing'),
('A3 Xerox - Black & White', '3', 4.00, 0, 'Printing'),
('A3 Xerox - Color', '4', 10.00, 0, 'Printing'),
('Lamination - A4', '5', 15.00, 0, 'Lamination'),
('Lamination - A3', '6', 25.00, 0, 'Lamination'),
('Binding - Spiral', '7', 30.00, 0, 'Binding'),
('Binding - Thermal', '8', 40.00, 0, 'Binding'),
('Printing - Single Side', '9', 3.00, 0, 'Printing'),
('Printing - Double Side', '10', 5.00, 0, 'Printing'),
('Scanning Service', '11', 10.00, 0, 'Services'),
('Photo Printing - 4x6', '12', 20.00, 0, 'Printing');
GO

-- Insert Sample Branches
INSERT INTO Branches (BranchName, BranchCode) VALUES
('Godown Spares (Ho)', 'GS'),
('Head Office', 'HO'),
('Namakkal', 'NMK'),
('Pattukottai', 'PTK'),
('Perambalur', 'PRM'),
('Pudukottai', 'PDK'),
('TAB Complex', 'TAB'),
('Thanjavur', 'TNJ'),
('Thiruvarur', 'TVR'),
('Trichy', 'TRY'),
('Work Shop (Ho)', 'WS');
GO

-- Insert Sample Locations
INSERT INTO Locations (LocationName) VALUES
('Moorthy Location'),
('Murugan Location'),
('Muruganantham Location');
GO

-- Insert Sample Users
INSERT INTO Users (Username, FullName, Role) VALUES
('Satya', 'Satya Kumar', 'Employee'),
('SSS', 'S S Sundaram', 'Employee'),
('Supervisor', 'Supervisor User', 'Supervisor'),
('USER', 'General User', 'Employee');
GO

-- Insert Sample Machine Types
INSERT INTO MachineTypes (MachineType) VALUES
('Xerox Machine Model XYZ'),
('Canon ImageRunner'),
('HP LaserJet Pro'),
('Ricoh MP Series'),
('Konica Minolta Bizhub');
GO

-- Insert Sample Adjustment Accounts
INSERT INTO AdjustmentAccounts (AccountName, AccountType) VALUES
('Discount - Percentage', 'less'),
('Discount - Flat Amount', 'less'),
('GST - 18%', 'add'),
('GST - 12%', 'add'),
('GST - 5%', 'add'),
('CGST - 9%', 'add'),
('SGST - 9%', 'add'),
('Service Charge', 'add'),
('Delivery Charge', 'add'),
('Handling Fee', 'add'),
('Packing Charge', 'add'),
('Round Off', 'less'),
('Early Payment Discount', 'less'),
('Loyalty Discount', 'less');
GO

-- Insert Sample Customer
INSERT INTO Customers (CustomerId, CustomerName, MobileNo, WhatsAppNo, CustomerType) VALUES
('CUST-001', 'ABC Enterprises', '+91-9876543210', '+91-9876543210', 'Regular'),
('CUST-002', 'XYZ Company', '+91-9876543211', '+91-9876543211', 'Premium'),
('CUST-003', 'Sample Customer', '+91-9876543212', '+91-9876543212', 'Regular');
GO

PRINT '✅ Database schema created and sample data inserted successfully!';
GO

