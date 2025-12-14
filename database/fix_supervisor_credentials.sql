-- ============================================
-- Fix Supervisor Credentials
-- ============================================
-- This script ensures the supervisor with username 'Supervisor' exists
-- and has the correct password 'Admin'
-- Database: CrystalCopier
-- ============================================

USE CrystalCopier;
GO

-- Check if supervisor exists (using trimmed comparison to handle spaces)
IF EXISTS (SELECT 1 FROM [dbo].[Supervisors] WHERE LTRIM(RTRIM(Username)) = 'Supervisor')
BEGIN
    PRINT 'Supervisor with username "Supervisor" exists. Updating credentials...';
    
    -- Update the supervisor to ensure correct credentials (handle any whitespace in username)
    UPDATE [dbo].[Supervisors]
    SET 
        [SupervisorName] = 'Main Supervisor',
        [Username] = 'Supervisor', -- Ensure no spaces
        [Password] = 'Admin', -- Ensure no spaces
        [Branch] = 'Head Office',
        [Location] = 'Main Location',
        [Status] = 'Active',
        [ModifiedDate] = GETDATE(),
        [ModifiedBy] = 'System'
    WHERE LTRIM(RTRIM(Username)) = 'Supervisor';
    
    PRINT '✅ Supervisor credentials updated successfully';
END
ELSE
BEGIN
    PRINT 'Supervisor with username "Supervisor" does not exist. Creating...';
    
    -- Insert the supervisor
    INSERT INTO [dbo].[Supervisors] (
        [SupervisorName], 
        [Username], 
        [Password], 
        [Branch], 
        [Location], 
        [Email], 
        [MobileNo], 
        [Status], 
        [CreatedDate], 
        [ModifiedDate], 
        [CreatedBy], 
        [ModifiedBy]
    )
    VALUES (
        'Main Supervisor', 
        'Supervisor', 
        'Admin', 
        'Head Office', 
        'Main Location',
        NULL, 
        NULL, 
        'Active', 
        GETDATE(), 
        GETDATE(),
        'System', 
        NULL
    );
    
    PRINT '✅ Supervisor created successfully';
END
GO

-- Also fix "supervisor 1" if it has a space (should be "supervisor1")
IF EXISTS (SELECT 1 FROM [dbo].[Supervisors] WHERE LTRIM(RTRIM(Username)) = 'supervisor1' OR Username LIKE 'supervisor%1%')
BEGIN
    UPDATE [dbo].[Supervisors]
    SET [Username] = 'supervisor1',
        [Password] = 'password123',
        [ModifiedDate] = GETDATE()
    WHERE LTRIM(RTRIM(Username)) = 'supervisor1' OR Username LIKE 'supervisor%1%';
    PRINT '✅ Fixed supervisor1 username (removed spaces)';
END
GO

-- Verify the supervisor
PRINT '';
PRINT '========================================';
PRINT 'Verification: Supervisor Credentials';
PRINT '========================================';
SELECT 
    SupervisorID,
    SupervisorName,
    Username,
    Password,
    Branch,
    Location,
    Status,
    CreatedDate,
    ModifiedDate
FROM [dbo].[Supervisors]
WHERE Username = 'Supervisor';
GO

-- Test authentication
PRINT '';
PRINT '========================================';
PRINT 'Testing Authentication';
PRINT '========================================';
DECLARE @TestUsername NVARCHAR(100) = 'Supervisor';
DECLARE @TestPassword NVARCHAR(255) = 'Admin';

EXEC sp_AuthenticateSupervisor @TestUsername, @TestPassword;
GO

PRINT '';
PRINT '========================================';
PRINT 'Completion time: ' + CONVERT(VARCHAR, GETDATE(), 126);
PRINT '========================================';
GO

