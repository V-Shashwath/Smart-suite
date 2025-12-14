-- ============================================
-- Quick Fix: Drop Gross Column with Constraint
-- ============================================
-- This script drops the default constraint on Gross column
-- and then removes the column
-- Database: CrystalCopier
-- ============================================

USE CrystalCopier;
GO

-- Drop the default constraint on Gross column
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
ELSE
BEGIN
    PRINT '⚠️ No default constraint found on Gross column';
END
GO

-- Now drop the Gross column
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceItems]') 
    AND name = 'Gross'
)
BEGIN
    ALTER TABLE [dbo].[InvoiceItems]
    DROP COLUMN [Gross];
    
    PRINT '✅ Gross column removed from InvoiceItems table';
END
ELSE
BEGIN
    PRINT '⚠️ Gross column does not exist in InvoiceItems table';
END
GO

PRINT '';
PRINT '✅ Fix completed! Gross column has been removed.';
GO

