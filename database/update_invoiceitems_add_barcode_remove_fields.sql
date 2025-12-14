-- ============================================
-- Update InvoiceItems Table: Add Barcode, Remove Gross, SalesMan, Comments6
-- ============================================
-- This script:
-- 1. Adds Barcode column between SNo and ProductName
-- 2. Removes Gross, SalesMan, Comments6 columns
-- Database: CrystalCopier
-- ============================================

USE CrystalCopier;
GO

-- ============================================
-- Step 1: Add Barcode column
-- ============================================
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceItems]') 
    AND name = 'Barcode'
)
BEGIN
    -- Add Barcode column after SNo
    ALTER TABLE [dbo].[InvoiceItems]
    ADD [Barcode] NVARCHAR(200) NULL;
    
    PRINT '✅ Barcode column added to InvoiceItems table';
END
ELSE
BEGIN
    PRINT '⚠️ Barcode column already exists in InvoiceItems table';
END
GO

-- ============================================
-- Step 2: Remove Gross column
-- ============================================
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceItems]') 
    AND name = 'Gross'
)
BEGIN
    -- First, drop any default constraints on Gross column
    DECLARE @GrossConstraintName NVARCHAR(200);
    
    SELECT @GrossConstraintName = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'[dbo].[InvoiceItems]')
    AND c.name = 'Gross';
    
    IF @GrossConstraintName IS NOT NULL
    BEGIN
        DECLARE @DropGrossConstraintSQL NVARCHAR(MAX) = 
            'ALTER TABLE [dbo].[InvoiceItems] DROP CONSTRAINT [' + @GrossConstraintName + ']';
        EXEC sp_executesql @DropGrossConstraintSQL;
        PRINT '✅ Dropped default constraint on Gross column: ' + @GrossConstraintName;
    END
    
    -- Now drop the column
    ALTER TABLE [dbo].[InvoiceItems]
    DROP COLUMN [Gross];
    
    PRINT '✅ Gross column removed from InvoiceItems table';
END
ELSE
BEGIN
    PRINT '⚠️ Gross column does not exist in InvoiceItems table';
END
GO

-- ============================================
-- Step 3: Remove SalesMan column
-- ============================================
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceItems]') 
    AND name = 'SalesMan'
)
BEGIN
    -- First, drop any default constraints on SalesMan column
    DECLARE @SalesManConstraintName NVARCHAR(200);
    
    SELECT @SalesManConstraintName = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'[dbo].[InvoiceItems]')
    AND c.name = 'SalesMan';
    
    IF @SalesManConstraintName IS NOT NULL
    BEGIN
        DECLARE @DropSalesManConstraintSQL NVARCHAR(MAX) = 
            'ALTER TABLE [dbo].[InvoiceItems] DROP CONSTRAINT [' + @SalesManConstraintName + ']';
        EXEC sp_executesql @DropSalesManConstraintSQL;
        PRINT '✅ Dropped default constraint on SalesMan column: ' + @SalesManConstraintName;
    END
    
    -- Now drop the column
    ALTER TABLE [dbo].[InvoiceItems]
    DROP COLUMN [SalesMan];
    
    PRINT '✅ SalesMan column removed from InvoiceItems table';
END
ELSE
BEGIN
    PRINT '⚠️ SalesMan column does not exist in InvoiceItems table';
END
GO

-- ============================================
-- Step 4: Remove Comments6 column
-- ============================================
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceItems]') 
    AND name = 'Comments6'
)
BEGIN
    -- First, drop any default constraints on Comments6 column
    DECLARE @Comments6ConstraintName NVARCHAR(200);
    
    SELECT @Comments6ConstraintName = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'[dbo].[InvoiceItems]')
    AND c.name = 'Comments6';
    
    IF @Comments6ConstraintName IS NOT NULL
    BEGIN
        DECLARE @DropComments6ConstraintSQL NVARCHAR(MAX) = 
            'ALTER TABLE [dbo].[InvoiceItems] DROP CONSTRAINT [' + @Comments6ConstraintName + ']';
        EXEC sp_executesql @DropComments6ConstraintSQL;
        PRINT '✅ Dropped default constraint on Comments6 column: ' + @Comments6ConstraintName;
    END
    
    -- Now drop the column
    ALTER TABLE [dbo].[InvoiceItems]
    DROP COLUMN [Comments6];
    
    PRINT '✅ Comments6 column removed from InvoiceItems table';
END
ELSE
BEGIN
    PRINT '⚠️ Comments6 column does not exist in InvoiceItems table';
END
GO

-- ============================================
-- Verification: Show current structure
-- ============================================
PRINT '';
PRINT '📋 Current InvoiceItems table structure:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'InvoiceItems'
ORDER BY ORDINAL_POSITION;
GO

PRINT '';
PRINT '✅ InvoiceItems table update completed successfully!';
PRINT '   - Added: Barcode column';
PRINT '   - Removed: Gross, SalesMan, Comments6 columns';
GO

