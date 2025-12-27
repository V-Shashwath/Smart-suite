-- ============================================
-- Update Supervisor Authentication to Use CrystalCopier Database
-- ============================================
-- This script updates the sp_AuthenticateSupervisor stored procedure
-- to explicitly use the CrystalCopier database for supervisor authentication

USE CrystalCopier;
GO

-- Drop existing procedure if it exists
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_AuthenticateSupervisor]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE [dbo].[sp_AuthenticateSupervisor];
    PRINT '✅ Dropped existing sp_AuthenticateSupervisor';
END
GO

-- Create updated procedure with explicit CrystalCopier database reference
CREATE PROCEDURE [dbo].[sp_AuthenticateSupervisor]
    @Username NVARCHAR(100),
    @Password NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Authenticate supervisor from Supervisors table in CrystalCopier database
    -- Only return active supervisors
    -- Trim whitespace from username and password for matching
    SELECT 
        SupervisorID,
        Username,
        SupervisorName,
        Email,
        MobileNo,
        Branch,
        Location,
        Status
    FROM CrystalCopier.dbo.Supervisors
    WHERE LTRIM(RTRIM(Username)) = LTRIM(RTRIM(@Username))
        AND LTRIM(RTRIM(Password)) = LTRIM(RTRIM(@Password))
        AND (Status = 'Active' OR Status IS NULL);
END;
GO

PRINT '✅ sp_AuthenticateSupervisor updated successfully to use CrystalCopier.dbo.Supervisors';
GO

-- Verify the procedure was created
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_AuthenticateSupervisor]') AND type in (N'P', N'PC'))
BEGIN
    PRINT '✅ Verification: sp_AuthenticateSupervisor exists in CrystalCopier database';
END
ELSE
BEGIN
    PRINT '❌ ERROR: sp_AuthenticateSupervisor was not created';
END
GO

-- Display all supervisors from CrystalCopier database
PRINT '';
PRINT '========================================';
PRINT 'Supervisors in CrystalCopier Database:';
PRINT '========================================';
SELECT 
    SupervisorID,
    Username,
    SupervisorName,
    Branch,
    Location,
    Status
FROM CrystalCopier.dbo.Supervisors;
GO

PRINT '';
PRINT '✅ Supervisor authentication update completed!';
PRINT '   All supervisor logins will now use CrystalCopier.dbo.Supervisors table';
GO

