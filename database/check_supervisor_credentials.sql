-- ============================================
-- Check Supervisor Credentials
-- ============================================
-- This script checks if supervisors exist and their credentials
-- Database: CrystalCopier
-- ============================================

USE CrystalCopier;
GO

-- Check all supervisors
PRINT '========================================';
PRINT 'All Supervisors in Database:';
PRINT '========================================';
SELECT 
    SupervisorID,
    SupervisorName,
    Username,
    Password,
    Branch,
    Location,
    Status,
    CreatedDate
FROM Supervisors
ORDER BY SupervisorID;
GO

-- Check specifically for 'Supervisor' username
PRINT '';
PRINT '========================================';
PRINT 'Supervisor with username "Supervisor":';
PRINT '========================================';
SELECT 
    SupervisorID,
    SupervisorName,
    Username,
    Password,
    Branch,
    Location,
    Status,
    CreatedDate
FROM Supervisors
WHERE Username = 'Supervisor';
GO

-- Test the stored procedure
PRINT '';
PRINT '========================================';
PRINT 'Testing sp_AuthenticateSupervisor:';
PRINT '========================================';
DECLARE @Username NVARCHAR(100) = 'Supervisor';
DECLARE @Password NVARCHAR(255) = 'Admin';

EXEC sp_AuthenticateSupervisor @Username, @Password;
GO

PRINT '';
PRINT '========================================';
PRINT 'Completion time: ' + CONVERT(VARCHAR, GETDATE(), 126);
PRINT '========================================';
GO

