-- ============================================
-- Update Customers Table: Remove GSTIN, Add CustomerType
-- ============================================
-- This script removes GSTIN column and adds CustomerType column
-- Database: CrystalCopier
-- ============================================

USE CrystalCopier;
GO

-- ============================================
-- Remove GSTIN column
-- ============================================
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') 
    AND name = 'GSTIN'
)
BEGIN
    -- First, drop any default constraints on GSTIN column
    DECLARE @GSTINConstraintName NVARCHAR(200);
    
    SELECT @GSTINConstraintName = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'[dbo].[Customers]')
    AND c.name = 'GSTIN';
    
    IF @GSTINConstraintName IS NOT NULL
    BEGIN
        DECLARE @DropGSTINConstraintSQL NVARCHAR(MAX) = 
            'ALTER TABLE [dbo].[Customers] DROP CONSTRAINT [' + @GSTINConstraintName + ']';
        EXEC sp_executesql @DropGSTINConstraintSQL;
        PRINT '✅ Dropped default constraint on GSTIN column: ' + @GSTINConstraintName;
    END
    
    -- Now drop the GSTIN column
    ALTER TABLE [dbo].[Customers] DROP COLUMN [GSTIN];
    PRINT '✅ GSTIN column removed from Customers table';
END
ELSE
BEGIN
    PRINT '⚠️ GSTIN column does not exist in Customers table';
END
GO

-- ============================================
-- Remove Status column (if exists)
-- ============================================
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') 
    AND name = 'Status'
)
BEGIN
    -- First, drop any default constraints on Status column
    DECLARE @StatusConstraintName NVARCHAR(200);
    
    SELECT @StatusConstraintName = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'[dbo].[Customers]')
    AND c.name = 'Status';
    
    IF @StatusConstraintName IS NOT NULL
    BEGIN
        DECLARE @DropStatusConstraintSQL NVARCHAR(MAX) = 
            'ALTER TABLE [dbo].[Customers] DROP CONSTRAINT [' + @StatusConstraintName + ']';
        EXEC sp_executesql @DropStatusConstraintSQL;
        PRINT '✅ Dropped default constraint on Status column: ' + @StatusConstraintName;
    END
    
    -- Now drop the Status column
    ALTER TABLE [dbo].[Customers] DROP COLUMN [Status];
    PRINT '✅ Status column removed from Customers table';
END
ELSE
BEGIN
    PRINT '⚠️ Status column does not exist in Customers table';
END
GO

-- ============================================
-- Add CustomerType column
-- ============================================
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') 
    AND name = 'CustomerType'
)
BEGIN
    ALTER TABLE [dbo].[Customers] 
    ADD [CustomerType] NVARCHAR(50) NULL;
    
    PRINT '✅ CustomerType column added to Customers table';
END
ELSE
BEGIN
    PRINT '⚠️ CustomerType column already exists in Customers table';
END
GO

-- ============================================
-- Verification
-- ============================================
PRINT '';
PRINT '========================================';
PRINT 'Verification: Customers table updated';
PRINT '========================================';

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo'
    AND TABLE_NAME = 'Customers'
ORDER BY ORDINAL_POSITION;
GO

-- Check if GSTIN and Status are removed
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
        AND TABLE_NAME = 'Customers'
        AND COLUMN_NAME = 'GSTIN'
) AND NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
        AND TABLE_NAME = 'Customers'
        AND COLUMN_NAME = 'Status'
) AND EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
        AND TABLE_NAME = 'Customers'
        AND COLUMN_NAME = 'CustomerType'
)
BEGIN
    PRINT '✅ Verification: GSTIN and Status removed, CustomerType added successfully';
END
ELSE
BEGIN
    PRINT '⚠️ Warning: Table structure may not match expected format';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'Completion time: ' + CONVERT(VARCHAR, GETDATE(), 126);
PRINT '========================================';
GO

