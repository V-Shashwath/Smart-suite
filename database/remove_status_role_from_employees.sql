-- ============================================
-- Remove Status and Role columns from Employees table
-- ============================================
-- This script removes Status and Role columns from the Employees table
-- Database: CrystalCopier
-- ============================================

USE CrystalCopier;
GO

-- ============================================
-- Remove Status column
-- ============================================
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Employees]') 
    AND name = 'Status'
)
BEGIN
    -- First, drop any default constraints on Status column
    DECLARE @StatusConstraintName NVARCHAR(200);
    
    SELECT @StatusConstraintName = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'[dbo].[Employees]')
    AND c.name = 'Status';
    
    IF @StatusConstraintName IS NOT NULL
    BEGIN
        DECLARE @DropStatusConstraintSQL NVARCHAR(MAX) = 
            'ALTER TABLE [dbo].[Employees] DROP CONSTRAINT [' + @StatusConstraintName + ']';
        EXEC sp_executesql @DropStatusConstraintSQL;
        PRINT '✅ Dropped default constraint on Status column: ' + @StatusConstraintName;
    END
    
    -- Now drop the Status column
    ALTER TABLE [dbo].[Employees] DROP COLUMN [Status];
    PRINT '✅ Status column removed from Employees table';
END
ELSE
BEGIN
    PRINT '⚠️ Status column does not exist in Employees table';
END
GO

-- ============================================
-- Remove Role column
-- ============================================
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Employees]') 
    AND name = 'Role'
)
BEGIN
    -- First, drop any default constraints on Role column
    DECLARE @RoleConstraintName NVARCHAR(200);
    
    SELECT @RoleConstraintName = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'[dbo].[Employees]')
    AND c.name = 'Role';
    
    IF @RoleConstraintName IS NOT NULL
    BEGIN
        DECLARE @DropRoleConstraintSQL NVARCHAR(MAX) = 
            'ALTER TABLE [dbo].[Employees] DROP CONSTRAINT [' + @RoleConstraintName + ']';
        EXEC sp_executesql @DropRoleConstraintSQL;
        PRINT '✅ Dropped default constraint on Role column: ' + @RoleConstraintName;
    END
    
    -- Now drop the Role column
    ALTER TABLE [dbo].[Employees] DROP COLUMN [Role];
    PRINT '✅ Role column removed from Employees table';
END
ELSE
BEGIN
    PRINT '⚠️ Role column does not exist in Employees table';
END
GO

-- ============================================
-- Verification
-- ============================================
PRINT '';
PRINT '========================================';
PRINT 'Verification: Status and Role columns removed';
PRINT '========================================';

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo'
    AND TABLE_NAME = 'Employees'
    AND COLUMN_NAME IN ('Status', 'Role');

IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
        AND TABLE_NAME = 'Employees'
        AND COLUMN_NAME = 'Status'
) AND NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
        AND TABLE_NAME = 'Employees'
        AND COLUMN_NAME = 'Role'
)
BEGIN
    PRINT '✅ Verification: Status and Role columns successfully removed';
    PRINT '';
    PRINT 'Remaining Employees table columns:';
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
        AND TABLE_NAME = 'Employees'
    ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT '⚠️ Warning: One or both columns may still exist';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'Completion time: ' + CONVERT(VARCHAR, GETDATE(), 126);
PRINT '========================================';
GO

