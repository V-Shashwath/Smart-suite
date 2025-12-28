-- ============================================
-- Migration: Add fields to InvoiceMain for all screens
-- This migration adds fields needed for RentalMonthlyBill, RentalService, and other screens
-- ============================================

USE CrystalCopier;
GO

-- Add new columns to InvoiceMain table if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceMain]') AND name = 'MachinePurchasedDate')
BEGIN
    ALTER TABLE [dbo].[InvoiceMain]
    ADD [MachinePurchasedDate] NVARCHAR(50) NULL;
    PRINT '✅ Added MachinePurchasedDate column to InvoiceMain';
END
ELSE
BEGIN
    PRINT '⚠️ MachinePurchasedDate column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceMain]') AND name = 'ContractExpiredOn')
BEGIN
    ALTER TABLE [dbo].[InvoiceMain]
    ADD [ContractExpiredOn] NVARCHAR(50) NULL;
    PRINT '✅ Added ContractExpiredOn column to InvoiceMain';
END
ELSE
BEGIN
    PRINT '⚠️ ContractExpiredOn column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceMain]') AND name = 'RemainingDays')
BEGIN
    ALTER TABLE [dbo].[InvoiceMain]
    ADD [RemainingDays] INT NULL;
    PRINT '✅ Added RemainingDays column to InvoiceMain';
END
ELSE
BEGIN
    PRINT '⚠️ RemainingDays column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceMain]') AND name = 'RemainingCopies')
BEGIN
    ALTER TABLE [dbo].[InvoiceMain]
    ADD [RemainingCopies] DECIMAL(18,2) NULL DEFAULT 0;
    PRINT '✅ Added RemainingCopies column to InvoiceMain';
END
ELSE
BEGIN
    PRINT '⚠️ RemainingCopies column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceMain]') AND name = 'SalesAccount')
BEGIN
    ALTER TABLE [dbo].[InvoiceMain]
    ADD [SalesAccount] NVARCHAR(200) NULL;
    PRINT '✅ Added SalesAccount column to InvoiceMain';
END
ELSE
BEGIN
    PRINT '⚠️ SalesAccount column already exists';
END
GO

-- ============================================
-- Create InvoiceReadings table for storing readings data
-- This table stores readings data that varies by screen type
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceReadings]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[InvoiceReadings] (
        [ReadingID] INT IDENTITY(1,1) PRIMARY KEY,
        [InvoiceID] INT NOT NULL,
        [VoucherSeries] NVARCHAR(50) NOT NULL,
        [VoucherNo] NVARCHAR(50) NOT NULL,
        
        -- Common reading fields
        [CurrentReading] NVARCHAR(50) NULL,
        [PreviousReading] NVARCHAR(50) NULL,
        [A4] NVARCHAR(50) NULL,
        [TotalA4] NVARCHAR(50) NULL,
        [CA4] NVARCHAR(50) NULL,
        [A3] NVARCHAR(50) NULL,
        [TotalA3] NVARCHAR(50) NULL,
        [CA3] NVARCHAR(50) NULL,
        [MonthlyCharges] DECIMAL(18,2) NULL DEFAULT 0,
        [Months] NVARCHAR(50) NULL,
        [FreeCopies] DECIMAL(18,2) NULL DEFAULT 0,
        [ChargeableCopies] DECIMAL(18,2) NULL DEFAULT 0,
        [ContractCharges] DECIMAL(18,2) NULL DEFAULT 0,
        [TestedCopies] DECIMAL(18,2) NULL DEFAULT 0,
        
        -- Store readings as JSON for flexibility (for future fields)
        [ReadingsJSON] NVARCHAR(MAX) NULL,
        
        [CreatedDate] DATETIME NULL DEFAULT GETDATE(),
        
        -- Foreign key
        CONSTRAINT FK_InvoiceReadings_InvoiceMain
        FOREIGN KEY ([InvoiceID]) REFERENCES [dbo].[InvoiceMain]([InvoiceID]) ON DELETE CASCADE
    );
    
    CREATE INDEX IX_InvoiceReadings_InvoiceID ON [dbo].[InvoiceReadings]([InvoiceID]);
    CREATE INDEX IX_InvoiceReadings_Voucher ON [dbo].[InvoiceReadings]([VoucherSeries], [VoucherNo]);
    
    PRINT '✅ InvoiceReadings table created successfully';
END
ELSE
BEGIN
    PRINT '⚠️ InvoiceReadings table already exists';
END
GO

PRINT '✅ Migration completed successfully!';
GO

