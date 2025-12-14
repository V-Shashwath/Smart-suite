-- ============================================
-- Create Tables in CrystalCopier Database
-- ============================================
-- This script creates all necessary tables for the mobile app
-- Database: CrystalCopier
-- ============================================

USE CrystalCopier;
GO

-- ============================================
-- 1. Employees Table
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Employees]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Employees] (
        [EmployeeID] INT IDENTITY(1,1) PRIMARY KEY,
        [Username] NVARCHAR(100) NOT NULL UNIQUE,
        [Password] NVARCHAR(255) NOT NULL,
        [EmployeeName] NVARCHAR(200) NOT NULL,
        [ShortName] NVARCHAR(50) NULL,
        [Email] NVARCHAR(200) NULL,
        [MobileNo] NVARCHAR(20) NULL,
        [Branch] NVARCHAR(100) NULL,
        [Location] NVARCHAR(100) NULL,
        [EmployeeLocation] NVARCHAR(100) NULL,
        [BillerName] NVARCHAR(200) NULL,
        [VoucherSeries] NVARCHAR(50) NULL DEFAULT 'ESI',
        [LastVoucherNumber] INT NULL DEFAULT 0,
        [CreatedDate] DATETIME NULL DEFAULT GETDATE(),
        [ModifiedDate] DATETIME NULL DEFAULT GETDATE(),
        [CreatedBy] NVARCHAR(100) NULL DEFAULT 'System',
        [ModifiedBy] NVARCHAR(100) NULL
    );
    
    CREATE INDEX IX_Employees_Username ON [dbo].[Employees]([Username]);
    
    PRINT '✅ Employees table created successfully';
END
ELSE
BEGIN
    PRINT '⚠️ Employees table already exists';
END
GO

-- ============================================
-- 2. Supervisors Table
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Supervisors]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Supervisors] (
        [SupervisorID] INT IDENTITY(1,1) PRIMARY KEY,
        [SupervisorName] NVARCHAR(200) NOT NULL,
        [Username] NVARCHAR(100) NOT NULL UNIQUE,
        [Password] NVARCHAR(255) NOT NULL,
        [Branch] NVARCHAR(100) NULL,
        [Location] NVARCHAR(100) NULL,
        [Email] NVARCHAR(200) NULL,
        [MobileNo] NVARCHAR(20) NULL,
        [Status] NVARCHAR(50) NULL DEFAULT 'Active',
        [CreatedDate] DATETIME NULL DEFAULT GETDATE(),
        [ModifiedDate] DATETIME NULL DEFAULT GETDATE(),
        [CreatedBy] NVARCHAR(100) NULL DEFAULT 'System',
        [ModifiedBy] NVARCHAR(100) NULL
    );
    
    CREATE INDEX IX_Supervisors_Username ON [dbo].[Supervisors]([Username]);
    
    PRINT '✅ Supervisors table created successfully';
END
ELSE
BEGIN
    PRINT '⚠️ Supervisors table already exists';
END
GO

-- ============================================
-- Insert Sample Supervisors Data
-- ============================================
-- Insert Supervisor One
IF NOT EXISTS (SELECT 1 FROM [dbo].[Supervisors] WHERE Username = 'supervisor1')
BEGIN
    INSERT INTO [dbo].[Supervisors] (
        [SupervisorName], [Username], [Password], [Branch], [Location], 
        [Email], [MobileNo], [Status], [CreatedDate], [ModifiedDate], 
        [CreatedBy], [ModifiedBy]
    )
    VALUES (
        'Supervisor One', 'supervisor1', 'password123', 'Head Office', 'Main Location',
        NULL, NULL, 'Active', '2025-12-04 20:23:30.203', '2025-12-04 20:23:30.203',
        NULL, NULL
    );
    PRINT '✅ Supervisor One inserted';
END
ELSE
BEGIN
    PRINT '⚠️ Supervisor One already exists';
END
GO

-- Insert Supervisor Two
IF NOT EXISTS (SELECT 1 FROM [dbo].[Supervisors] WHERE Username = 'supervisor2')
BEGIN
    INSERT INTO [dbo].[Supervisors] (
        [SupervisorName], [Username], [Password], [Branch], [Location], 
        [Email], [MobileNo], [Status], [CreatedDate], [ModifiedDate], 
        [CreatedBy], [ModifiedBy]
    )
    VALUES (
        'Supervisor Two', 'supervisor2', 'password123', 'Branch Office', 'Branch Location',
        NULL, NULL, 'Active', '2025-12-04 20:23:30.203', '2025-12-04 20:23:30.203',
        NULL, NULL
    );
    PRINT '✅ Supervisor Two inserted';
END
ELSE
BEGIN
    PRINT '⚠️ Supervisor Two already exists';
END
GO

-- Insert Main Supervisor
IF NOT EXISTS (SELECT 1 FROM [dbo].[Supervisors] WHERE Username = 'Supervisor')
BEGIN
    INSERT INTO [dbo].[Supervisors] (
        [SupervisorName], [Username], [Password], [Branch], [Location], 
        [Email], [MobileNo], [Status], [CreatedDate], [ModifiedDate], 
        [CreatedBy], [ModifiedBy]
    )
    VALUES (
        'Main Supervisor', 'Supervisor', 'Admin', 'Head Office', 'Main Location',
        NULL, NULL, 'Active', '2025-12-05 08:39:08.900', '2025-12-05 08:39:08.900',
        NULL, NULL
    );
    PRINT '✅ Main Supervisor inserted';
END
ELSE
BEGIN
    PRINT '⚠️ Main Supervisor already exists';
END
GO

-- ============================================
-- 3. Customers Table
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Customers] (
        [CustomerID] INT IDENTITY(1,1) PRIMARY KEY,
        [CustomerName] NVARCHAR(200) NOT NULL,
        [Address] NVARCHAR(500) NULL,
        [MobileNo] NVARCHAR(20) NULL,
        [WhatsAppNo] NVARCHAR(20) NULL,
        [Email] NVARCHAR(200) NULL,
        [CustomerType] NVARCHAR(50) NULL,
        [CreatedDate] DATETIME NULL DEFAULT GETDATE(),
        [ModifiedDate] DATETIME NULL DEFAULT GETDATE(),
        [CreatedBy] NVARCHAR(100) NULL DEFAULT 'System',
        [ModifiedBy] NVARCHAR(100) NULL
    );
    
    CREATE INDEX IX_Customers_MobileNo ON [dbo].[Customers]([MobileNo]);
    CREATE INDEX IX_Customers_WhatsAppNo ON [dbo].[Customers]([WhatsAppNo]);
    CREATE INDEX IX_Customers_CustomerName ON [dbo].[Customers]([CustomerName]);
    
    PRINT '✅ Customers table created successfully';
END
ELSE
BEGIN
    PRINT '⚠️ Customers table already exists';
END
GO

-- ============================================
-- 3. InvoiceMain Table (renamed from EmployeeSaleInvoiceMain)
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceMain]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[InvoiceMain] (
        [InvoiceID] INT IDENTITY(1,1) PRIMARY KEY,
        [VoucherSeries] NVARCHAR(50) NOT NULL,
        [VoucherNo] NVARCHAR(50) NOT NULL,
        [VoucherDatetime] NVARCHAR(50) NULL,
        [TransactionDate] NVARCHAR(50) NULL,
        [TransactionTime] NVARCHAR(50) NULL,
        [Branch] NVARCHAR(100) NULL,
        [Location] NVARCHAR(100) NULL,
        [EmployeeLocation] NVARCHAR(100) NULL,
        [Username] NVARCHAR(100) NULL,
        [HeaderDate] NVARCHAR(50) NULL,
        [BillerName] NVARCHAR(200) NULL,
        [EmployeeName] NVARCHAR(200) NULL,
        [CustomerID] INT NULL,
        [CustomerName] NVARCHAR(200) NULL,
        [ReadingA4] NVARCHAR(50) NULL,
        [ReadingA3] NVARCHAR(50) NULL,
        [MachineType] NVARCHAR(100) NULL,
        [Remarks] NVARCHAR(500) NULL,
        [GstBill] BIT NULL DEFAULT 0,
        [CollectedCash] DECIMAL(18,2) NULL DEFAULT 0,
        [CollectedCard] DECIMAL(18,2) NULL DEFAULT 0,
        [CollectedUpi] DECIMAL(18,2) NULL DEFAULT 0,
        [Balance] DECIMAL(18,2) NULL DEFAULT 0,
        [ItemCount] INT NULL DEFAULT 0,
        [TotalQty] DECIMAL(18,2) NULL DEFAULT 0,
        [TotalGross] DECIMAL(18,2) NULL DEFAULT 0,
        [TotalDiscount] DECIMAL(18,2) NULL DEFAULT 0,
        [TotalAdd] DECIMAL(18,2) NULL DEFAULT 0,
        [TotalLess] DECIMAL(18,2) NULL DEFAULT 0,
        [TotalBillValue] DECIMAL(18,2) NULL DEFAULT 0,
        [LedgerBalance] DECIMAL(18,2) NULL DEFAULT 0,
        [CreatedDate] DATETIME NULL DEFAULT GETDATE(),
        [ModifiedDate] DATETIME NULL,
        [CreatedBy] NVARCHAR(100) NULL DEFAULT 'System',
        [ModifiedBy] NVARCHAR(100) NULL
    );
    
    CREATE INDEX IX_InvoiceMain_VoucherSeries_VoucherNo ON [dbo].[InvoiceMain]([VoucherSeries], [VoucherNo]);
    CREATE INDEX IX_InvoiceMain_Username ON [dbo].[InvoiceMain]([Username]);
    CREATE INDEX IX_InvoiceMain_CustomerID ON [dbo].[InvoiceMain]([CustomerID]);
    CREATE INDEX IX_InvoiceMain_CreatedDate ON [dbo].[InvoiceMain]([CreatedDate]);
    
    PRINT '✅ InvoiceMain table created successfully';
END
ELSE
BEGIN
    PRINT '⚠️ InvoiceMain table already exists';
END
GO

-- ============================================
-- 4. InvoiceItems Table (renamed from EmployeeSaleInvoiceItems)
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceItems]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[InvoiceItems] (
        [ItemID] INT IDENTITY(1,1) PRIMARY KEY,
        [InvoiceID] INT NOT NULL,
        [VoucherSeries] NVARCHAR(50) NOT NULL,
        [VoucherNo] NVARCHAR(50) NOT NULL,
        [SNo] INT NULL DEFAULT 0,
        [ProductId] INT NULL,
        [ProductName] NVARCHAR(200) NULL,
        [Barcode] NVARCHAR(200) NULL,
        [ProductSerialNo] NVARCHAR(100) NULL,
        [Quantity] DECIMAL(18,2) NULL DEFAULT 0,
        [FreeQty] DECIMAL(18,2) NULL DEFAULT 0,
        [Rate] DECIMAL(18,2) NULL DEFAULT 0,
        [Net] DECIMAL(18,2) NULL DEFAULT 0,
        [Comments1] NVARCHAR(500) NULL,
        [CreatedDate] DATETIME NULL DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_InvoiceItems_InvoiceID ON [dbo].[InvoiceItems]([InvoiceID]);
    CREATE INDEX IX_InvoiceItems_VoucherSeries_VoucherNo ON [dbo].[InvoiceItems]([VoucherSeries], [VoucherNo]);
    CREATE INDEX IX_InvoiceItems_ProductSerialNo ON [dbo].[InvoiceItems]([ProductSerialNo]);
    
    -- Foreign key constraint
    ALTER TABLE [dbo].[InvoiceItems]
    ADD CONSTRAINT FK_InvoiceItems_InvoiceMain
    FOREIGN KEY ([InvoiceID]) REFERENCES [dbo].[InvoiceMain]([InvoiceID]) ON DELETE CASCADE;
    
    PRINT '✅ InvoiceItems table created successfully';
END
ELSE
BEGIN
    PRINT '⚠️ InvoiceItems table already exists';
END
GO

-- ============================================
-- 5. InvoiceAdjustments Table (renamed from EmployeeSaleInvoiceAdjustments)
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceAdjustments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[InvoiceAdjustments] (
        [AdjustmentID] INT IDENTITY(1,1) PRIMARY KEY,
        [InvoiceID] INT NOT NULL,
        [VoucherSeries] NVARCHAR(50) NOT NULL,
        [VoucherNo] NVARCHAR(50) NOT NULL,
        [AccountId] INT NULL,
        [AccountName] NVARCHAR(200) NULL,
        [AccountType] NVARCHAR(50) NULL DEFAULT 'add',
        [AddAmount] DECIMAL(18,2) NULL DEFAULT 0,
        [LessAmount] DECIMAL(18,2) NULL DEFAULT 0,
        [Comments] NVARCHAR(500) NULL,
        [CreatedDate] DATETIME NULL DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_InvoiceAdjustments_InvoiceID ON [dbo].[InvoiceAdjustments]([InvoiceID]);
    CREATE INDEX IX_InvoiceAdjustments_VoucherSeries_VoucherNo ON [dbo].[InvoiceAdjustments]([VoucherSeries], [VoucherNo]);
    
    -- Foreign key constraint
    ALTER TABLE [dbo].[InvoiceAdjustments]
    ADD CONSTRAINT FK_InvoiceAdjustments_InvoiceMain
    FOREIGN KEY ([InvoiceID]) REFERENCES [dbo].[InvoiceMain]([InvoiceID]) ON DELETE CASCADE;
    
    PRINT '✅ InvoiceAdjustments table created successfully';
END
ELSE
BEGIN
    PRINT '⚠️ InvoiceAdjustments table already exists';
END
GO

-- ============================================
-- 7. ExecutiveScreenAssignments Table
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ExecutiveScreenAssignments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ExecutiveScreenAssignments] (
        [AssignmentID] INT IDENTITY(1,1) PRIMARY KEY,
        [EmployeeID] INT NOT NULL,
        [ScreenRoute] NVARCHAR(100) NOT NULL,
        [CreatedDate] DATETIME NULL DEFAULT GETDATE(),
        [CreatedBy] NVARCHAR(100) NULL DEFAULT 'System',
        [ModifiedDate] DATETIME NULL DEFAULT GETDATE(),
        [ModifiedBy] NVARCHAR(100) NULL,
        CONSTRAINT UQ_ExecutiveScreen UNIQUE (EmployeeID, ScreenRoute)
    );
    
    CREATE INDEX IX_ExecutiveScreenAssignments_EmployeeID ON [dbo].[ExecutiveScreenAssignments]([EmployeeID]);
    CREATE INDEX IX_ExecutiveScreenAssignments_ScreenRoute ON [dbo].[ExecutiveScreenAssignments]([ScreenRoute]);
    
    -- Foreign key constraint
    ALTER TABLE [dbo].[ExecutiveScreenAssignments]
    ADD CONSTRAINT FK_ExecutiveScreenAssignments_Employees
    FOREIGN KEY ([EmployeeID]) REFERENCES [dbo].[Employees]([EmployeeID]) ON DELETE CASCADE;
    
    PRINT '✅ ExecutiveScreenAssignments table created successfully';
END
ELSE
BEGIN
    PRINT '⚠️ ExecutiveScreenAssignments table already exists';
END
GO

-- ============================================
-- Verification
-- ============================================
PRINT '';
PRINT '========================================';
PRINT 'Table Creation Summary';
PRINT '========================================';
PRINT 'Tables created in CrystalCopier database:';
PRINT '1. Employees';
PRINT '2. Supervisors';
PRINT '3. Customers';
PRINT '4. InvoiceMain (renamed from EmployeeSaleInvoiceMain)';
PRINT '5. InvoiceItems (renamed from EmployeeSaleInvoiceItems)';
PRINT '6. InvoiceAdjustments (renamed from EmployeeSaleInvoiceAdjustments)';
PRINT '7. ExecutiveScreenAssignments';
PRINT '========================================';
GO

