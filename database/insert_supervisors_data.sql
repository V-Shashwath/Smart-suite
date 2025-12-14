-- ============================================
-- Insert Supervisors Data into CrystalCopier Database
-- ============================================
-- This script inserts sample supervisor data
-- Database: CrystalCopier
-- ============================================

USE CrystalCopier;
GO

-- ============================================
-- Insert Supervisor One
-- ============================================
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
    PRINT '✅ Supervisor One inserted successfully';
END
ELSE
BEGIN
    UPDATE [dbo].[Supervisors]
    SET [SupervisorName] = 'Supervisor One',
        [Password] = 'password123',
        [Branch] = 'Head Office',
        [Location] = 'Main Location',
        [Status] = 'Active',
        [ModifiedDate] = GETDATE()
    WHERE Username = 'supervisor1';
    PRINT '⚠️ Supervisor One already exists - updated';
END
GO

-- ============================================
-- Insert Supervisor Two
-- ============================================
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
    PRINT '✅ Supervisor Two inserted successfully';
END
ELSE
BEGIN
    UPDATE [dbo].[Supervisors]
    SET [SupervisorName] = 'Supervisor Two',
        [Password] = 'password123',
        [Branch] = 'Branch Office',
        [Location] = 'Branch Location',
        [Status] = 'Active',
        [ModifiedDate] = GETDATE()
    WHERE Username = 'supervisor2';
    PRINT '⚠️ Supervisor Two already exists - updated';
END
GO

-- ============================================
-- Insert Main Supervisor
-- ============================================
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
    PRINT '✅ Main Supervisor inserted successfully';
END
ELSE
BEGIN
    UPDATE [dbo].[Supervisors]
    SET [SupervisorName] = 'Main Supervisor',
        [Password] = 'Admin',
        [Branch] = 'Head Office',
        [Location] = 'Main Location',
        [Status] = 'Active',
        [ModifiedDate] = GETDATE()
    WHERE Username = 'Supervisor';
    PRINT '⚠️ Main Supervisor already exists - updated';
END
GO

-- ============================================
-- Verification
-- ============================================
PRINT '';
PRINT '========================================';
PRINT 'Supervisors Data Verification';
PRINT '========================================';

SELECT 
    SupervisorID,
    SupervisorName,
    Username,
    Password,
    Branch,
    Location,
    Email,
    MobileNo,
    Status,
    CreatedDate,
    ModifiedDate,
    CreatedBy,
    ModifiedBy
FROM [dbo].[Supervisors]
ORDER BY SupervisorID;
GO

PRINT '';
PRINT '========================================';
PRINT 'Completion time: ' + CONVERT(VARCHAR, GETDATE(), 126);
PRINT '========================================';
GO

